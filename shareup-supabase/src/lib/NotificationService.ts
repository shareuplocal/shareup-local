import { supabase } from '../supabase';

export class NotificationService {
  private static instance: NotificationService;
  private permissionGranted: boolean = false;

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  public async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') { this.permissionGranted = true; return true; }
    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      this.permissionGranted = permission === 'granted';
      return this.permissionGranted;
    }
    return false;
  }

  public showNotification(title: string, options?: NotificationOptions) {
    if (this.permissionGranted || Notification.permission === 'granted') {
      new Notification(title, { icon: '/logo192.png', ...options });
    }
  }

  public listenForNewDonations(userId: string, userLat: number, userLng: number, radiusOverride?: number): () => void {
    const channelName = `new-donations-${userId}-${Date.now()}`;
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'donations' }, (payload) => {
        const donation = payload.new as any;
        if (!donation || donation.donor_id === userId) return;
        const loc = donation.location;
        if (!loc?.lat || !loc?.lng) return;
        const dist = this.calculateDistance(userLat, userLng, loc.lat, loc.lng);
        if (dist <= (radiusOverride || 10)) {
          this.showNotification('Nouveau don à proximité !', {
            body: `${donation.title} est disponible à ${dist.toFixed(1)}km.`,
            tag: `new-donation-${donation.id}`,
          });
        }
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }

  public listenForNewMessages(userId: string): () => void {
    const channelName = `new-messages-${userId}-${Date.now()}`;
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'conversations' }, (payload) => {
        const conv = payload.new as any;
        if (!conv || !conv.participants?.includes(userId) || conv.last_message_sender_id === userId) return;
        this.showNotification('Nouveau message', { body: conv.last_message, tag: 'new-message' });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }

  public listenForFriendRequests(userId: string): () => void {
    const channelName = `friend-requests-${userId}-${Date.now()}`;
    const channel = supabase.channel(channelName)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'friend_requests', filter: `to_id=eq.${userId}` }, (payload) => {
        const request = payload.new as any;
        if (!request) return;
        this.showNotification("Nouvelle demande d'ami", {
          body: `${request.from_name} souhaite devenir votre ami sur ShareUP !`,
          tag: `friend-request-${request.id}`,
        });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    const a = Math.sin(dLat/2)**2 + Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLon/2)**2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  private deg2rad(deg: number): number { return deg * (Math.PI / 180); }
}
