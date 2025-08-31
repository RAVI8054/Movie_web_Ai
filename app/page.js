"use client";

import Link from "next/link";
import Image from "next/image";

export default function Page() {
  return (
    <div className="p-6 bg-gradient-to-r from-red-500 to-pink-600 min-h-screen">
      {/* Container */}
      <div className="flex flex-row h-screen m-6 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Left Section – Image */}
        <section className="w-1/2 h-screen relative">
          <div className="relative w-full h-full">
            <Image
              src="/Ai2.jpg"
              alt="AI Movie Buddy"
              layout="fill"
              priority
              className="object-cover"
            />
          </div>
        </section>

        {/* Right Section – Content */}
        <section className="w-1/2 h-screen flex items-center justify-center bg-white">
          <div className="max-w-lg p-10 rounded-2xl shadow-lg bg-gradient-to-b from-gray-50 to-white">
            {/* Headings */}
            <h1 className="text-5xl font-extrabold text-gray-800 mb-4 leading-tight drop-shadow-sm">
              Searching for Movies <span className="text-red-500">Made Simple</span>
            </h1>
            <h2 className="text-xl text-gray-600 mb-8">
              Your AI Movie Buddy — <span className="font-semibold">Ask. Watch. Enjoy.</span>
            </h2>

            {/* Chat Button */}
            <Link href="/chat">
  <button className="relative px-6 py-3 text-lg font-medium text-white bg-blue-600 rounded-xl shadow-md transform transition duration-300 hover:scale-105 hover:bg-blue-700 focus:ring-4 focus:ring-blue-300">
    <span className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500 to-indigo-600 opacity-70 blur-md animate-pulse"></span>
    <span className="relative">💬 Chat with AI</span>
  </button>
</Link>

          </div>
        </section>
      </div>
    </div>
  );
}
