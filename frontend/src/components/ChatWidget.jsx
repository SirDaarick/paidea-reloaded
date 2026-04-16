import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { useIdAlumno } from "../consultas/idAlumno"; 
import "styles/Chat.css";
import logoBurrito from "assets/logo_burrito.png";

const ChatWidget = () => {

  const [identificadorReal, setIdentificadorReal] = useState(""); 
  const [rolDetectadoVisual, setRolDetectadoVisual] = useState("");

  // ==============================================================
  // 🕵️ ESCÁNER (LÓGICA INTACTA)
  // ==============================================================
  useEffect(() => {
    const buscarIdentidad = () => {
      console.log("🕵️ Buscando credenciales (RFC o Boleta)...");
      let idEncontrado = null;
      let rolEncontrado = "";

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        const valor = localStorage.getItem(key);

        try {
          const obj = JSON.parse(valor);
          if (obj.rol === "Profesor" || obj.rol === "Docente") {
            const rfc = obj.datosPersonales?.rfc || obj.rfc || obj.correo;
            if (rfc) { 
                idEncontrado = rfc; 
                rolEncontrado = "Profesor"; 
                break; 
            }
          }
          if (obj.boleta || (obj.rol === "Alumno")) {
            const boleta = obj.boleta || obj.idAlumno;
            if (boleta) { 
                idEncontrado = boleta; 
                rolEncontrado = "Alumno"; 
            }
          }
        } catch (e) { }

        if (typeof valor === "string" && valor.match(/^[A-ZÑ&]{3,4}\d{6}/)) {
           if (!valor.includes("20230000")) {
             idEncontrado = valor;
             rolEncontrado = "Profesor";
             break; 
           }
        }

        if (typeof valor === "string" && valor.match(/^\d{8,10}$/)) {
            if (valor !== "202300000" && valor !== "20230000") {
                if (rolEncontrado !== "Profesor") {
                    idEncontrado = valor;
                    rolEncontrado = "Alumno";
                }
            }
        }
      }

      if (idEncontrado) {
        console.log(`🎯 CHAT CONFIGURADO: ${rolEncontrado} (${idEncontrado})`);
        setIdentificadorReal(idEncontrado);
        setRolDetectadoVisual(rolEncontrado);
        return true;
      }
      return false;
    };

    const exitoInicial = buscarIdentidad();
    let intervalo = null;

    if (!exitoInicial) {
      intervalo = setInterval(() => {
        const exito = buscarIdentidad();
        if (exito) clearInterval(intervalo);
      }, 1500); 
    }

    return () => { if (intervalo) clearInterval(intervalo); };
  }, []);

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  
  // NUEVO ESTADO PARA EXPANDIR
  const [isExpanded, setIsExpanded] = useState(false); // <--- NUEVO

  const [messages, setMessages] = useState([
    { role: "assistant", content: "¡Hola! Soy TecnoBurro 🫏 ¿En qué puedo ayudarte hoy?" }
  ]);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [dragging, setDragging] = useState(false);

  const [position, setPosition] = useState(() => {
    const saved = sessionStorage.getItem("chatPosition");
    return saved ? JSON.parse(saved) : { x: 20, y: window.innerHeight - 150 };
  });

  const dragOffset = useRef({ x: 0, y: 0 });
  const bubbleRef = useRef(null);

  useEffect(() => {
    sessionStorage.setItem("chatPosition", JSON.stringify(position));
  }, [position]);

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragOffset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    };
    setDragging(true);
  };

  const handleTouchStart = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const touch = e.touches[0];
    dragOffset.current = {
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;

    const onMouseMove = (e) => {
      e.preventDefault();
      setPosition({
        x: e.clientX - dragOffset.current.x,
        y: e.clientY - dragOffset.current.y
      });
    };

    const onMouseUp = () => setDragging(false);

    const onTouchMove = (e) => {
      e.preventDefault();
      const touch = e.touches[0];
      setPosition({
        x: touch.clientX - dragOffset.current.x,
        y: touch.clientY - dragOffset.current.y
      });
    };

    const onTouchEnd = () => setDragging(false);

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [dragging]);

  const toggleChat = () => {
    if (!open) {
      setOpen(true);
      setMinimized(false);
      setTimeout(() => {
        const inputEl = document.querySelector(".chat-input input");
        if (inputEl) inputEl.focus();
      }, 100);
    }
  };

  // FUNCION PARA ALTERNAR TAMAÑO
  const handleExpandToggle = (e) => { // <--- NUEVA FUNCION
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleMinimize = (e) => {
    e.stopPropagation();
    setMinimized(true);
    setOpen(false);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setMessages([
      { role: "assistant", content: "¡Hola! Soy TecnoBurro 🫏 ¿En qué puedo ayudarte hoy?" }
    ]);
    setOpen(false);
    setMinimized(false);
    setIsExpanded(false); // Reseteamos el tamaño al cerrar
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setSending(true);

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "loading...", loader: true }
    ]);

    try {
      const historialParaEnviar = messages
        .filter(m => !m.loader)
        .slice(-6);

      console.log(`📤 Enviando: "${text}" | ID: ${identificadorReal} (${rolDetectadoVisual})`);

      const res = await fetch("https://6b7a27edf2b6.ngrok-free.app/preguntar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ 
          pregunta: text,
          identificador: identificadorReal, 
          historial: historialParaEnviar 
        })
      });

      const data = await res.json();

      setMessages((prev) => prev.filter((m) => !m.loader));

      if (res.ok) {
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: data.respuesta }
          ]);
      } else {
          console.error("Backend Error:", data);
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content: "Ocurrió un error al procesar tu solicitud." }
          ]);
      }

    } catch (error) {
      console.error(error);
      setMessages((prev) => prev.filter((m) => !m.loader));
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "⚠️ Error al conectar con TecnoBurro. Intenta de nuevo." }
      ]);
    }

    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.altKey) {
      e.preventDefault();
      handleSend();
    } else if (e.key === "Enter" && e.altKey) {
      setInput((prev) => prev + "\n");
    }
  };

  return (
    <>
      {open && !minimized && (
        // AGREGAMOS LA CLASE CONDICIONAL 'expanded' AQUÍ ABAJO
        <div className={`chat-window ${isExpanded ? "expanded" : ""}`}> 
          <div className="chat-window-header">
            <span className="chat-window-title">
              TecnoBurro {rolDetectadoVisual ? `(${rolDetectadoVisual})` : ""}
            </span>
            <div className="chat-window-controls">
              
              {/* BOTÓN NUEVO DE EXPANDIR */}
              <button 
                className="control-btn expand" 
                onClick={handleExpandToggle}
                title={isExpanded ? "Restaurar" : "Maximizar"}
              >
                {isExpanded ? "❐" : "⬜"} 
              </button>

              <button className="control-btn minimize" onClick={handleMinimize}>
                —
              </button>
              <button className="control-btn close" onClick={handleClose}>
                ✕
              </button>
            </div>
          </div>

          <div className="chat-body">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`msg ${msg.role === "user" ? "user" : "assistant"}`}
              >
                {msg.loader ? (
                  <div className="loader">
                    <span></span><span></span><span></span>
                  </div>
                ) : (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                )}
              </div>
            ))}
          </div>

          <div className="chat-input">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escribe tu mensaje..."
            />
            <button onClick={handleSend}>➤</button>
          </div>
        </div>
      )}

      {(!open || minimized) && (
        <div
          ref={bubbleRef}
          className={`chat-bubble ${dragging ? "dragging" : ""}`}
          style={{
            left: position.x,
            top: position.y,
            backgroundImage: `url(${logoBurrito})`,
          }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onClick={(e) => {
            if (!dragging) toggleChat();
          }}
        />
      )}
    </>
  );
};

export default ChatWidget;