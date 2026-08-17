export type MetricConversation = {
  status: string;
  leadStatus: string;
};

export type MetricAppointment = {
  status: string;
};

export function calculatePilotMetrics(
  conversationRows: MetricConversation[],
  appointmentRows: MetricAppointment[],
) {
  return {
    conversations: conversationRows.length,
    qualified: conversationRows.filter(item => item.leadStatus === "qualified" || item.leadStatus === "scheduled").length,
    appointments: appointmentRows.filter(item => item.status !== "canceled").length,
    humanHandoffs: conversationRows.filter(item => item.status === "human").length,
  };
}
