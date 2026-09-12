import {observeMachineAdmin, isAdminUser} from "/shared/auth/admin-access.js";
const link = document.createElement("a");
link.className = "btn-pill";
link.textContent = "Solicitudes de máquinas";
link.href = "/solicitudes/";
document.querySelector(".ls-filterbar")?.append(link);
observeMachineAdmin((user) => { link.hidden = !isAdminUser(user); });
