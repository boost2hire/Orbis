import { Bell, Mail, MessageCircle, Package } from "lucide-react";

const notifications = [
  { icon: Mail, text: "3 new emails", time: "2m ago" },
  { icon: MessageCircle, text: "Message from Sarah", time: "15m ago" },
  { icon: Package, text: "Package delivered", time: "1h ago" },
];

const NotificationsWidget = () => {
  return (
    <div className="glass-panel p-6 animate-fade-in delay-300">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="w-4 h-4 text-primary" strokeWidth={1.5} />
        <span className="text-sm text-light text-foreground/80">Notifications</span>
        <span className="ml-auto text-xs text-thin text-primary">3</span>
      </div>
      
      <div className="space-y-3">
        {notifications.map((notif, i) => (
          <div key={i} className="flex items-center gap-3">
            <notif.icon className="w-4 h-4 text-muted-foreground/50" strokeWidth={1.5} />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-light text-foreground/80 truncate">{notif.text}</p>
              <p className="text-xs text-thin text-muted-foreground/40">{notif.time}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificationsWidget;
