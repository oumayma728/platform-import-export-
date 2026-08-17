import React, { useState } from 'react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 fixed top-0 left-0 w-full z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <span className="font-bold text-xl tracking-tight border-2 border-black px-2 py-1 select-none">
              Indeed²
            </span>
          </div>

          {/* Navigation Desktop (Cachée sur mobile: hidden md:flex) */}
          <div className="hidden md:flex space-x-6 items-center">
            <a href="#" className="text-gray-700 hover:text-black text-sm font-medium transition">Annonces</a>
            <a href="#" className="text-gray-700 hover:text-black text-sm font-medium transition">Mes annonces</a>
            <a href="#" className="text-gray-700 hover:text-black text-sm font-medium transition">Matching IA</a>
            <a href="#" className="text-gray-700 hover:text-black text-sm font-medium transition">Messagerie</a>
            <a href="#" className="text-gray-700 hover:text-black text-sm font-medium transition">Facturation</a>
            <a href="#" className="text-gray-700 hover:text-black text-sm font-medium transition">Profil</a>
            <button type="button" className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-md font-medium transition">
              Déconnexion
            </button>
          </div>

          {/* Bouton Burger Mobile (Affiché UNIQUEMENT sur mobile: md:hidden) */}
          <div className="md:hidden flex items-center">
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              type="button"
              aria-expanded={isOpen}
              aria-label="Toggle navigation"
              className="text-gray-700 hover:text-black p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-300"
            >
              {isOpen ? (
                // Icon Close (X)
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                // Icon Burger Menu
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Menu Dropdown Mobile (N'apparaît que sur mobile et quand isOpen = true) */}
      {isOpen && (
        
        <div className="md:hidden bg-white border-b border-gray-200 px-4 pt-2 pb-4 space-y-2 shadow-lg">
          <a href="#" className="block py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-md px-3 transition">Annonces</a>
          <a href="#" className="block py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-md px-3 transition">Mes annonces</a>
          <a href="#" className="block py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-md px-3 transition">Matching IA</a>
          <a href="#" className="block py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-md px-3 transition">Messagerie</a>
          <a href="#" className="block py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-md px-3 transition">Facturation</a>
          <a href="#" className="block py-2 text-gray-700 font-medium hover:bg-gray-50 rounded-md px-3 transition">Profil</a>
          <button type="button" className="w-full text-center bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md font-medium mt-2 transition">
            Déconnexion
          </button>
        </div>
      )}
    </nav>
  );
};

export default Navbar;