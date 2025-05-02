"use client";

import { metadata } from './metadata';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { useEffect } from 'react';
import { io } from 'socket.io-client';
import { getSocket } from '@/lib/socket';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    const socket = getSocket();

    socket.on('connectsocket', (data) => {
      console.log('connected', data)
    })

    return () => {
      socket.off('connectsocket')
    }
  }, [])

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
