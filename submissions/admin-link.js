import {observeMachineAdmin, isAdminUser} from "/ls_maquinaria/agregador/firebase-config.js";
const link = document.createElement("a");
link.className = "btn-pill";
link.textContent = "Solicitudes de máquinas";
link.href = "/solicitudes/";
document.querySelector(".ls-filterbar")?.append(link);
observeMachineAdmin((user) => { link.hidden = !isAdminUser(user); });
