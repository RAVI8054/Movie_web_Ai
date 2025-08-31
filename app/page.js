"use client";

import Link from "next/link";
import Image from "next/image";

export default function Page() {
  return (
    <div className="p-8 bg-red-500">
      {/* Container */}
      <div className="flex flex-row h-screen m-10">
        
        {/* Left Section – Image */}
        <section className="w-1/2 h-screen">
          <div className="relative w-full h-full p-10">
            <Image
              src="/Ai2.jpg"
              alt="AI Movie Buddy"
              fill
              priority
              className="object-cover"
            />
          </div>
        </section>

        {/* Right Section – Content */}
        <section className="w-1/2 h-screen flex ">
         <div className="m-0">
          <div className="p">
            <h1 className="text-4xl font-bold ">
              Searching for Movies Made Simple
            </h1>
            <h2 className="text-xl ">
              Your AI Movie Buddy — Ask. Watch. Enjoy.
            </h2>
            <Link href="/chat">
              <button className="bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700">
                Chat with AI
              </button>
            </Link>
          </div>
          </div>
        </section>
      </div>
    </div>
  );
}
