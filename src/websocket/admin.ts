import { io } from "../http";
import { ConnectionsService } from "../services/ConnectionsService";
import { MessagesService } from "../services/MessagesService";


io.on("connect", async (socket) => {
  const connectionsServices = new ConnectionsService();
  const messagesServices = new MessagesService();

  const allConnectionsWithoutAdmin = await connectionsServices.findAllWithoutAdmin();

  io.emit("admin_list_all_users",   allConnectionsWithoutAdmin);

  socket.on("admin_list_messages_by_user", async (params, callback) => {
    const { user_id } = params;

    const allMessages = await messagesServices.listByUser(user_id);
    callback(allMessages);
  });

  socket.on("admin_send_message", async ({ user_id, text }) => {
    await messagesServices.create({
      text,
      user_id,
      admin_id: socket.id
    });

    const { socket_id } = await connectionsServices.findByUserId(user_id);

    io.to(socket_id).emit("admin_send_to_client", {
      text,
      socket_id: socket.id
    });
  });

  socket.on("admin_user_in_suport", async ({ user_id }) => {
    await connectionsServices.updateAdminID(user_id, socket.id);

    const allConnectionsWithoutAdmin = await connectionsServices.findAllWithoutAdmin();
    io.emit("admin_list_all_users", allConnectionsWithoutAdmin);
  });

});