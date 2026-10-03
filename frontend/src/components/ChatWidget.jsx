import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "context/AuthContext";
import WidgetRenderer from "./chat/WidgetRenderer";
import "styles/Chat.css";
import logoBurrito from "assets/logo_burrito.png";
import { simulateAgentStream } from "../demo/mockAgent";
import { isDemoActive } from "../demo/isDemoMode";

const DISCOVERY_CARDS = [
  {
    icon: "🎓",
    title: "Mi Kárdex Oficial",
    desc: "Promedio general, créditos y materias",
    query: "¿Cuál es mi kárdex oficial, promedio y créditos acumulados?"
  },
  {
    icon: "📅",
    title: "Horario y Clases",
    desc: "Asignaturas, salones y profesores",
    query: "¿Cuál es mi horario de clases vigente y salones asignados?"
  },
  {
    icon: "🎯",
    title: "Simulador de Calificación",
    desc: "Calcula qué nota necesitas en el 3er parcial",
    query: "Quiero simular mi calificación de Compiladores con meta 8.5"
  },
  {
    icon: "📝",
    title: "Exámenes ETS",
    desc: "Fechas, salones y aplicadores de extraordinarios",
    query: "¿Cuáles son mis exámenes ETS registrados o periodos disponibles?"
  },
  {
    icon: "📚",
    title: "Optativas y Plan",
    desc: "Mapa curricular y asignaturas disponibles",
    query: "¿Qué materias optativas puedo cursar en mi carrera?"
  },
  {
    icon: "⚖️",
    title: "Normativa y Dictamen",
    desc: "Artículos 41 y 47 del RGE, permanencia y bajas",
    query: "Audita mi situación escolar con el Reglamento General de Estudios"
  }
];

const formatToolStatus = (toolName) => {
  switch (toolName) {
    case "consultar_mi_kardex":
      return "Consultando kárdex y materias aprobadas...";
    case "consultar_mis_materias_actuales":
      return "Revisando materias inscritas en el semestre...";
    case "consultar_asistencias_y_faltas":
      return "Auditando asistencias y aplicando Art. 45 RGE...";
    case "consultar_cupos_materias":
      return "Verificando disponibilidad de cupos...";
    case "consultar_estatus_mis_tramites":
      return "Consultando estatus de trámites escolares...";
    case "inscribir_examen_ets":
      return "Preparando solicitud de inscripción a ETS...";
    case "consultar_mis_ets":
      return "Consultando calendario y exámenes ETS...";
    case "consultar_optativas_y_plan":
      return "Consultando mapa curricular y optativas...";
    case "ubicar_profesor_o_salon":
      return "Localizando profesor o cubículo en ESCOM...";
    case "identificar_alumnos_en_riesgo":
      return "Generando reporte de alumnos en riesgo académico...";
    case "consultar_lista_grupo":
      return "Consultando lista de alumnos del grupo...";
    case "consultar_reglamento_academico":
      return "Consultando normativa y Reglamento General de Estudios...";
    default:
      return "TecnoBurro está procesando tus datos...";
  }
};

const ChatWidget = () => {
  const { user, token, role, isAuthenticated } = useAuth();

  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [threadId, setThreadId] = useState(null);

  const initialGreeting = isAuthenticated
    ? `¡Hola, ${user?.nombre || "Politécnico"}! 🫏 Soy TecnoBurro, tu asistente académico de PAIDEA en ESCOM. Puedes preguntarme o seleccionar alguna de las opciones directas:`
    : "¡Hola! Soy TecnoBurro 🫏 ¿En qué puedo ayudarte hoy?";

  const [messages, setMessages] = useState([
    { role: "assistant", content: initialGreeting }
  ]);

  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const [position, setPosition] = useState(() => {
    const saved = sessionStorage.getItem("chatPosition");
    return saved ? JSON.parse(saved) : { x: 20, y: window.innerHeight - 150 };
  });

  const dragOffset = useRef({ x: 0, y: 0 });
  const bubbleRef = useRef(null);
  const chatBodyRef = useRef(null);

  // Auto-scroll al final en cada mensaje nuevo
  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, sending]);

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

  const handleExpandToggle = (e) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleMinimize = (e) => {
    e.stopPropagation();
    setMinimized(true);
    setOpen(false);
  };

  const handleNewConversation = (e) => {
    e.stopPropagation();
    setThreadId(null);
    setMessages([
      { role: "assistant", content: initialGreeting }
    ]);
  };

  const handleClose = (e) => {
    e.stopPropagation();
    setOpen(false);
    setMinimized(false);
    setIsExpanded(false);
  };

  const executeSend = async (queryText) => {
    const text = (queryText || input).trim();
    if (!text || sending) return;

    setMessages((prev) => [...prev, { role: "user", content: text }]);
    setInput("");
    setSending(true);

    setMessages((prev) => [
      ...prev,
      { role: "assistant", content: "", loader: true, statusText: "Consultando con TecnoBurro..." }
    ]);

    try {
      const historialParaEnviar = messages
        .filter((m) => !m.loader)
        .slice(-6)
        .map((m) => ({ role: m.role, content: m.content }));

      if (isDemoActive()) {
        let accumulatedText = "";
        await simulateAgentStream({
          mensaje: text,
          threadId,
          user,
          onEvent: (eventData) => {
            if (eventData.type === "thread" && eventData.thread_id) {
              setThreadId(eventData.thread_id);
            } else if (eventData.type === "tool_start") {
              const statusLabel = formatToolStatus(eventData.tool);
              setMessages((prev) => {
                const copy = [...prev];
                const lastIdx = copy.length - 1;
                if (lastIdx >= 0) {
                  copy[lastIdx] = { ...copy[lastIdx], statusText: statusLabel };
                }
                return copy;
              });
            } else if (eventData.type === "token") {
              accumulatedText += eventData.content;
              setMessages((prev) => {
                const copy = [...prev];
                const lastIdx = copy.length - 1;
                if (lastIdx >= 0) {
                  copy[lastIdx] = {
                    role: "assistant",
                    content: accumulatedText,
                    loader: false
                  };
                }
                return copy;
              });
            } else if (eventData.type === "done") {
              accumulatedText = eventData.full_text || accumulatedText;
              setMessages((prev) => {
                const copy = [...prev];
                const lastIdx = copy.length - 1;
                if (lastIdx >= 0) {
                  copy[lastIdx] = {
                    role: "assistant",
                    content: accumulatedText,
                    loader: false
                  };
                }
                return copy;
              });
            }
          }
        });
        setSending(false);
        return;
      }

      const baseApiUrl = import.meta.env?.VITE_API_URL || "";

      if (token) {
        // 🛡️ Endpoint moderno con streaming SSE en tiempo real y persistencia relacional
        const url = `${baseApiUrl}/api/v1/agent/chat/stream`;
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            mensaje: text,
            thread_id: threadId,
            historial: historialParaEnviar
          })
        });

        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: Error al conectar con el asistente.`);
        }

        const reader = res.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let accumulatedText = "";
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const parts = buffer.split("\n\n");
          buffer = parts.pop() || "";

          for (const part of parts) {
            const trimmed = part.trim();
            if (!trimmed.startsWith("data: ")) continue;

            try {
              const eventData = JSON.parse(trimmed.slice(6));

              if (eventData.type === "thread" && eventData.thread_id) {
                setThreadId(eventData.thread_id);
              } else if (eventData.type === "tool_start") {
                const statusLabel = formatToolStatus(eventData.tool);
                setMessages((prev) => {
                  const copy = [...prev];
                  const lastIdx = copy.length - 1;
                  if (lastIdx >= 0) {
                    copy[lastIdx] = { ...copy[lastIdx], statusText: statusLabel };
                  }
                  return copy;
                });
              } else if (eventData.type === "token") {
                accumulatedText += eventData.content;
                setMessages((prev) => {
                  const copy = [...prev];
                  const lastIdx = copy.length - 1;
                  if (lastIdx >= 0) {
                    copy[lastIdx] = {
                      role: "assistant",
                      content: accumulatedText,
                      loader: false
                    };
                  }
                  return copy;
                });
              } else if (eventData.type === "done") {
                accumulatedText = eventData.full_text || accumulatedText;
                setMessages((prev) => {
                  const copy = [...prev];
                  const lastIdx = copy.length - 1;
                  if (lastIdx >= 0) {
                    copy[lastIdx] = {
                      role: "assistant",
                      content: accumulatedText,
                      loader: false
                    };
                  }
                  return copy;
                });
              } else if (eventData.type === "error") {
                accumulatedText = eventData.content || "Ocurrió una interrupción al generar la respuesta.";
                setMessages((prev) => {
                  const copy = [...prev];
                  const lastIdx = copy.length - 1;
                  if (lastIdx >= 0) {
                    copy[lastIdx] = {
                      role: "assistant",
                      content: accumulatedText,
                      loader: false
                    };
                  }
                  return copy;
                });
              }
            } catch (errJson) {
              console.warn("Fragmento SSE omitido:", trimmed, errJson);
            }
          }
        }
      } else {
        // 🔄 Endpoint retrocompatible con efecto máquina de escribir
        const url = `${baseApiUrl}/preguntar`;
        const identificador = user?.boleta_o_rfc || user?.email || "2021630001";
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            pregunta: text,
            identificador: identificador,
            historial: historialParaEnviar
          })
        });

        const data = await res.json();
        if (res.ok && data.respuesta) {
          let currentContent = "";
          const words = data.respuesta.split(" ");
          for (let i = 0; i < words.length; i++) {
            currentContent += (i === 0 ? "" : " ") + words[i];
            setMessages((prev) => {
              const copy = [...prev];
              copy[copy.length - 1] = {
                role: "assistant",
                content: currentContent,
                loader: false
              };
              return copy;
            });
            await new Promise((r) => setTimeout(r, 16));
          }
        } else {
          setMessages((prev) => {
            const copy = [...prev];
            copy[copy.length - 1] = {
              role: "assistant",
              content: data.detail || "Error al procesar la consulta con el servidor.",
              loader: false
            };
            return copy;
          });
        }
      }
    } catch (error) {
      console.error(error);
      setMessages((prev) => {
        const copy = prev.filter((m) => !m.loader);
        return [
          ...copy,
          { role: "assistant", content: "⚠️ Error de conexión con TecnoBurro. Por favor verifica que el backend esté en ejecución." }
        ];
      });
    }

    setSending(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.altKey) {
      e.preventDefault();
      executeSend();
    } else if (e.key === "Enter" && e.altKey) {
      setInput((prev) => prev + "\n");
    }
  };

  const toggleVoiceRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Tu navegador no soporta la Web Speech API nativa. Prueba en Google Chrome o Microsoft Edge.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = "es-MX";
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
        }
      };

      recognition.onerror = (event) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (e) {
      console.error("Error al iniciar reconocimiento de voz:", e);
      setIsListening(false);
    }
  };

  const handleConfirmAction = async (action, payload) => {
    const token = localStorage.getItem("token") || localStorage.getItem("access_token");
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/agent/action/confirm`, {
        method: "POST",
        headers,
        body: JSON.stringify({ action, payload }),
      });
      const data = await res.json();
      return data;
    } catch (e) {
      console.error("Error al confirmar acción:", e);
      return { success: false, detail: "Error de red al confirmar la acción." };
    }
  };

  const rolVisual = role ? (role.charAt(0).toUpperCase() + role.slice(1)) : (user?.rol || "");

  return (
    <>
      {open && !minimized && (
        <div className={`chat-window ${isExpanded ? "expanded" : ""}`}>
          <div className="chat-window-header">
            <div className="chat-window-title">
              <span className="burro-emoji">🫏</span>
              <div className="title-texts">
                <span className="main-title">TecnoBurro 2.0</span>
                {rolVisual && <span className="role-badge">{rolVisual}</span>}
              </div>
            </div>
            <div className="chat-window-controls">
              <button
                className="control-btn new-chat"
                onClick={handleNewConversation}
                title="Nueva conversación"
              >
                ✎
              </button>
              <button
                className="control-btn expand"
                onClick={handleExpandToggle}
                title={isExpanded ? "Restaurar" : "Maximizar"}
              >
                {isExpanded ? "❐" : "⬜"}
              </button>
              <button className="control-btn minimize" onClick={handleMinimize} title="Minimizar">
                —
              </button>
              <button className="control-btn close" onClick={handleClose} title="Cerrar">
                ✕
              </button>
            </div>
          </div>

          <div className="chat-body" ref={chatBodyRef}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`msg ${msg.role === "user" ? "user" : "assistant"}`}
              >
                {msg.loader ? (
                  <div className="loader-container">
                    <div className="loader">
                      <span></span><span></span><span></span>
                    </div>
                    {msg.statusText && (
                      <span className="loader-status-text">
                        <span className="text-accent-blue animate-pulse">⚡</span>
                        {msg.statusText}
                      </span>
                    )}
                  </div>
                ) : (
                  <WidgetRenderer
                    content={msg.content}
                    onSelectSuggestion={(suggQuery) => executeSend(suggQuery)}
                    onConfirmAction={handleConfirmAction}
                  />
                )}
              </div>
            ))}

            {/* 🌟 DISCOVERY HUB: Guía Inicial de Exploración para el Estudiante */}
            {messages.length <= 1 && (
              <div className="discovery-hub">
                <div className="discovery-hub-header">
                  <span className="hub-sparkle">✨</span>
                  <span>Temas recomendados para comenzar:</span>
                </div>
                <div className="discovery-grid">
                  {DISCOVERY_CARDS.map((card, cIdx) => (
                    <div
                      key={cIdx}
                      className="discovery-card"
                      onClick={() => executeSend(card.query)}
                    >
                      <span className="card-icon">{card.icon}</span>
                      <div className="card-text">
                        <strong className="card-title">{card.title}</strong>
                        <span className="card-desc">{card.desc}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="chat-input">
            <button
              type="button"
              className={`mic-btn ${isListening ? "is-listening" : ""}`}
              onClick={toggleVoiceRecognition}
              title={isListening ? "Escuchando... Haz clic para detener" : "Hablar con TecnoBurro (Reconocimiento de Voz)"}
            >
              {isListening ? "🔴" : "🎤"}
            </button>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? "🎙️ Escuchando tu voz..." : "Consulta kárdex, horarios, reglamentos IPN..."}
              disabled={sending}
            />
            <button onClick={() => executeSend()} disabled={sending || !input.trim()}>
              ➤
            </button>
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
          title="Abrir asistente TecnoBurro"
        />
      )}
    </>
  );
};

export default ChatWidget;