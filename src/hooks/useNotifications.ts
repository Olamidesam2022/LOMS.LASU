import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import {
  markNotificationRead,
  NOTIFICATIONS_REFRESH_EVENT,
} from "@/lib/notifications";

export interface AppNotification {
  id: string;
  type: "urgent" | "info" | "warning";
  message: string;
  user_id: string;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { user, isApproved } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  const fetchNotifications = useCallback(async () => {
    if (!user || !isApproved) {
      setNotifications([]);
      return;
    }

    const { data, error } = await supabase
      .from("notifications")
      .select("id,type,message,user_id,read,created_at")
      .eq("read", false)
      .order("created_at", { ascending: false });

    if (error) throw error;
    setNotifications((data || []) as AppNotification[]);
  }, [isApproved, user]);

  const markAsRead = useCallback(
    async (id: string) => {
      await markNotificationRead(id);
      setNotifications((current) =>
        current.filter((notification) => notification.id !== id),
      );
    },
    [],
  );

  const markAllAsRead = useCallback(async () => {
    const unreadIds = notifications
      .filter((notification) => !notification.read)
      .map((notification) => notification.id);

    if (unreadIds.length === 0) return;

    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", unreadIds);

    if (error) throw error;
    setNotifications([]);
    window.dispatchEvent(new Event(NOTIFICATIONS_REFRESH_EVENT));
  }, [fetchNotifications, notifications]);

  useEffect(() => {
    fetchNotifications().catch(console.error);
  }, [fetchNotifications]);

  useEffect(() => {
    const refreshNotifications = () => {
      fetchNotifications().catch(console.error);
    };

    window.addEventListener(NOTIFICATIONS_REFRESH_EVENT, refreshNotifications);

    return () => {
      window.removeEventListener(
        NOTIFICATIONS_REFRESH_EVENT,
        refreshNotifications,
      );
    };
  }, [fetchNotifications]);

  return { notifications, fetchNotifications, markAsRead, markAllAsRead };
}
