import { ChatRoomScreen } from "@/components/chat/chat-room-screen";

export default async function ChatRoomPage({
  params
}: {
  params: Promise<{ matchId: string }>;
}): Promise<React.JSX.Element> {
  const { matchId } = await params;

  return <ChatRoomScreen matchId={matchId} />;
}
