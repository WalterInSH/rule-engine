'use client';

import { useState, useEffect } from 'react';
import { Space } from '@/types/Space';
import { fetchSpaces, getCurrentSpaceId, setCurrentSpaceId } from '@/utils/spaceManager';
import Link from 'next/link';

export default function SpaceSelector() {
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [currentSpaceId, setSpaceId] = useState('default');

  useEffect(() => {
    const init = async () => {
        const list = await fetchSpaces();
        setSpaces(list);
        setSpaceId(getCurrentSpaceId());
    };
    init();

    // Listen to space changes (if triggered from elsewhere)
    const handleSpaceChange = () => {
        setSpaceId(getCurrentSpaceId());
        // Also refresh list in case a new space was added
        fetchSpaces().then(setSpaces);
    };

    window.addEventListener('spaceChanged', handleSpaceChange);
    return () => {
        window.removeEventListener('spaceChanged', handleSpaceChange);
    };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newVal = e.target.value;
    if (newVal === '__manage__') {
        window.location.href = '/spaces'; // Hard navigation to ensure menu closes? Or Link.
        return;
    }
    setCurrentSpaceId(newVal);
    setSpaceId(newVal);
  };

  return (
    <div className="relative inline-block text-left mr-4">
      <select
        value={currentSpaceId}
        onChange={handleChange}
        className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-slate-800 text-white border-slate-700"
      >
        {spaces.map((space) => (
          <option key={space.id} value={space.id}>
            {space.name}
          </option>
        ))}
        <option disabled>──────────</option>
        <option value="__manage__">⚙️ Manage Spaces...</option>
      </select>
    </div>
  );
}
