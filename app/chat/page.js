"use client";

import { useState, useEffect, useRef } from "react";
import { IoSearch } from "react-icons/io5";
import Image from "next/image";

export default function Chat() {
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSearch = async () => {
    if (!query.trim()) return;

    const updatedMessages = [...messages, { sender: "user", text: query }];
    setMessages(updatedMessages);

    try {
      const response = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ search: query }),
      });

      const result = await response.json();

      if (Array.isArray(result)) {
        if (result[0]?.message) {
          setMessages([
            ...updatedMessages,
            { sender: "ai", type: "text", text: result[0].message },
            { sender: "ai", type: "movies", movies: result.slice(1) },
          ]);
        } else {
          setMessages([
            ...updatedMessages,
            { sender: "ai", type: "movies", movies: result },
          ]);
        }
      } else if (result.message) {
        setMessages([
          ...updatedMessages,
          { sender: "ai", type: "text", text: result.message },
        ]);
      } else if (result.error) {
        setMessages([
          ...updatedMessages,
          { sender: "ai", type: "text", text: `❌ ${result.error}` },
        ]);
      } else {
        setMessages([
          ...updatedMessages,
          {
            sender: "ai",
            type: "text",
            text: "❌ Sorry, I couldn’t understand. Please wait 1–2 seconds or try again.",
          },
        ]);
      }

      setQuery("");
    } catch (error) {
      console.error("Error:", error);
      setMessages([
        ...updatedMessages,
        { sender: "ai", type: "text", text: "⚠️ Something went wrong." },
      ]);
    }
  };

  return (
    <div className="flex w-full h-screen">
      {/* Left Image */}
      <div className="w-1/5 h-full relative max-[500px]:hidden">
        <Image src="/robo.jpg" alt="AI" fill className="object-cover" priority />
      </div>

      {/* Chat Window */}
      <div className="flex-1 h-full flex flex-col bg-red-300 relative">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`flex ${msg.sender === "ai" ? "justify-start" : "justify-end"}`}
            >
              {msg.sender === "ai" && msg.type === "movies" ? (
                <div className="grid gap-4">
                  {msg.movies.map((movie, i) => (
                    <div key={i} className="bg-white shadow-md rounded-lg p-4 border">
                      <h3 className="font-bold text-lg text-gray-800">{movie.title}</h3>
                      <p className="text-gray-600">{movie.description}</p>
                      <p className="text-sm mt-1">
                        <span className="font-semibold">📅 Year:</span> {movie.year}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">⭐ Rating:</span> {movie.rating}
                      </p>
                      <p className="text-sm">
                        <span className="font-semibold">🎭 Genre:</span> {movie.genre}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  className={`max-w-xs px-5 py-3 rounded-2xl shadow-md ${
                    msg.sender === "ai" ? "bg-blue-100 text-left" : "bg-green-100 text-right"
                  }`}
                >
                  {msg.text}
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 bg-red-100 flex items-center">
          <input
            type="text"
            className="w-full h-12 px-4 outline-none bg-white rounded-l-2xl text-base"
            placeholder="Type your message..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
          />
          <div
            onClick={handleSearch}
            className="bg-white h-12 w-12 flex items-center justify-center cursor-pointer rounded-r-2xl"
          >
            <IoSearch size="22px" color="black" />
          </div>
        </div>
      </div>

      {/* Right Image */}
      <div className="w-1/5 h-full relative max-[500px]:hidden">
        <Image src="/unknow.jpg" alt="User" fill className="object-cover" />
      </div>
    </div>
  );
}
