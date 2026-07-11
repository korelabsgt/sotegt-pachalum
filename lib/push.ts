import webpush from "web-push";
import supabaseAdmin from "@/lib/supabaseAdmin";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:soporte@sote.gt";

let vapidConfigurado = false;

function configurarVapid() {
  if (vapidConfigurado) return true;
  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn(
      "[push] Faltan las claves VAPID (NEXT_PUBLIC_VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY). No se enviarán notificaciones.",
    );
    return false;
  }
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
  vapidConfigurado = true;
  return true;
}

interface SubscripcionRow {
  id: string;
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface NotificacionPushInput {
  titulo: string;
  mensaje: string;
  ruta?: string;
  userIds?: string[] | null;
  tag?: string;
}

function truncarMensajePush(mensaje: string, max = 160) {
  const limpio = mensaje.replace(/\s+/g, " ").trim();
  if (limpio.length <= max) return limpio;
  return `${limpio.slice(0, max - 3)}...`;
}

export async function enviarNotificacionPush({
  titulo,
  mensaje,
  ruta = "/",
  userIds,
  tag,
}: NotificacionPushInput): Promise<{ enviadas: number; fallidas: number }> {
  if (!configurarVapid()) return { enviadas: 0, fallidas: 0 };

  if (Array.isArray(userIds) && userIds.length === 0) {
    return { enviadas: 0, fallidas: 0 };
  }

  let query = supabaseAdmin
    .from("sis_push_subscriptions")
    .select("id, endpoint, p256dh, auth");

  if (Array.isArray(userIds)) {
    query = query.in("user_id", userIds);
  }

  const { data: subs, error } = await query;

  if (error) {
    console.error("[push] Error leyendo suscripciones:", error.message);
    return { enviadas: 0, fallidas: 0 };
  }

  if (!subs || subs.length === 0) return { enviadas: 0, fallidas: 0 };

  const payload = JSON.stringify({
    titulo,
    mensaje: truncarMensajePush(mensaje),
    ruta: ruta || "/",
    tag: tag || "sote-difusion",
  });

  const endpointsMuertos: string[] = [];
  let enviadas = 0;
  let fallidas = 0;

  await Promise.all(
    (subs as SubscripcionRow[]).map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: { p256dh: sub.p256dh, auth: sub.auth },
          },
          payload,
        );
        enviadas++;
      } catch (err: unknown) {
        fallidas++;
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          endpointsMuertos.push(sub.endpoint);
        } else {
          console.error(
            "[push] Error enviando a",
            sub.endpoint?.slice(0, 40),
            statusCode || (err as Error)?.message,
          );
        }
      }
    }),
  );

  if (endpointsMuertos.length > 0) {
    await supabaseAdmin
      .from("sis_push_subscriptions")
      .delete()
      .in("endpoint", endpointsMuertos);
  }

  return { enviadas, fallidas };
}
