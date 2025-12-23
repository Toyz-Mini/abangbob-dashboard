import { Order, OrderItem } from '@/lib/types';

export const WhatsAppService = {
  /**
   * standard wa.me URL generator
   */
  generateLink: (phone: string, message: string) => {
    // Remove non-digit chars, ensure country code if missing (default to 673 for Brunei if starts with 8/7/2)
    let cleanPhone = phone.replace(/\D/g, '');

    // Simple heuristic for Brunei numbers (usually 7 digits starting with 8, 7, or 2)
    // If it's already 10+ digits, assume it has country code. 
    // If it's 7 digits, add 673.
    if (cleanPhone.length === 7) {
      cleanPhone = '673' + cleanPhone;
    }

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/${cleanPhone}?text=${encodedMessage}`;
  },

  /**
   * Generates a text receipt for the order
   */
  generateReceiptMessage: (order: Order) => {
    const date = new Date(order.createdAt).toLocaleDateString();
    const time = new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let message = `*ABANGOBOB RECIEPT*\n`;
    message += `Order #${order.orderNumber}\n`;
    message += `${date} ${time}\n\n`;

    message += `*Items:*\n`;
    order.items.forEach(item => {
      message += `${item.quantity}x ${item.name}`;
      if (item.variant) message += ` (${item.variant})`;
      message += ` - $${(item.price * item.quantity).toFixed(2)}\n`;
      if (item.modifiers && item.modifiers.length > 0) {
        item.modifiers.forEach(mod => {
          message += `  + ${mod.name}\n`;
        });
      }
    });

    message += `\n*TOTAL: BND ${order.total.toFixed(2)}*\n`;
    message += `Payment: ${order.paymentMethod.toUpperCase()}\n\n`;
    message += `Thank you for your support!`;

    return message;
  },

  /**
   * Generates "Order Ready" message
   */
  generateOrderReadyMessage: (order: Order, customerName?: string) => {
    let message = `*ABANGBOB ORDER UPDATE*\n\n`;
    if (customerName) message += `Hi ${customerName},\n`;
    message += `Good news! Your order *#${order.orderNumber}* is ready for pickup/delivery.\n\n`;

    if (order.items.length > 0) {
      const summary = order.items.map(i => `${i.quantity}x ${i.name}`).join(', ');
      message += `Order: ${summary}\n`;
    }

    message += `\nPlease come to the counter to collect. Thank you!`;
    return message;
  },

  openWhatsApp: (phone: string, message: string) => {
    const url = WhatsAppService.generateLink(phone, message);
    window.open(url, '_blank');
  }
};
