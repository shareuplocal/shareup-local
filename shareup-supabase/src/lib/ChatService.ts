import { supabase } from '../supabase';

export const ChatService = {
  // Supprime toutes les conversations liées à une donation
  async deleteConversationByDonationId(donationId: string) {
    try {
      // Récupérer les IDs des conversations concernées
      const { data: convs } = await supabase
        .from('conversations')
        .select('id')
        .eq('donation_id', donationId);

      if (!convs || convs.length === 0) return;

      for (const conv of convs) {
        await this.deleteConversationById(conv.id);
      }
      console.log(`Conversations for donation ${donationId} deleted.`);
    } catch (error) {
      console.error('Error deleting conversations by donation:', error);
    }
  },

  // Supprime une conversation et tous ses messages
  async deleteConversationById(conversationId: string) {
    try {
      // Les messages sont supprimés en cascade grâce à ON DELETE CASCADE dans le schéma
      const { error } = await supabase
        .from('conversations')
        .delete()
        .eq('id', conversationId);

      if (error) throw error;
      console.log(`Conversation ${conversationId} deleted.`);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  },

  // Supprime toutes les conversations d'un utilisateur
  async deleteConversationsByUserId(userId: string) {
    try {
      const { data: convs } = await supabase
        .from('conversations')
        .select('id')
        .contains('participants', [userId]);

      if (!convs) return;

      for (const conv of convs) {
        await this.deleteConversationById(conv.id);
      }
      console.log(`Conversations for user ${userId} deleted.`);
    } catch (error) {
      console.error('Error deleting conversations by user:', error);
    }
  },
};
