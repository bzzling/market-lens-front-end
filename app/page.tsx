'use client';

import { ArrowRightIcon } from '@heroicons/react/24/outline';
import Link from 'next/link';
import Image from 'next/image';
import { spaceGrotesk } from '@/app/fonts';

export default function Page() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <div className="flex flex-col justify-center gap-6 rounded-lg p-6 md:w-2/3 lg:px-12 xl:px-20">
            <p className={`${spaceGrotesk.className} text-xl text-white md:text-3xl md:leading-normal`}>
              <strong>Welcome to Market Lens.</strong> A modern stock market simulator built specifically
              for investors, students, and enthusiasts.
            </p>
            <Link
              href="/signup"
              className="flex items-center gap-5 self-start rounded-lg bg-white px-6 sm:px-12 md:px-16 lg:px-20 py-3 text-sm font-medium text-black transition-colors hover:bg-gray-200 md:text-base"
            >
              <span>Get Started</span> <ArrowRightIcon className="w-5 md:w-6" />
            </Link>
          </div>
          <div className="flex items-center justify-start md:w-1/3 -ml-16">
            <Image
              src="/bull.svg"
              width={350}
              height={266}
              priority
              className="hidden md:block w-auto h-auto"
              alt="Bull"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
