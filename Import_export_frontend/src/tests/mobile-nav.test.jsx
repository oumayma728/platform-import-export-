import { describe, it, expect, afterEach, beforeEach } from "vitest";
import { render, screen, within, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import "@testing-library/jest-dom/vitest";

import UserHeaderLayout from "../components/templates/UserHeaderLayout";
import VisitorLayout from "../components/templates/VisitorLayout";
import { AuthProvider } from "../context/AuthContext";

// @testing-library/react nettoie automatiquement entre les tests via un hook
// global "afterEach" — mais vitest.config a `globals: false`, donc on
// l'enregistre nous-mêmes pour éviter des DOM qui s'accumulent d'un test à
// l'autre (ce qui provoquait des faux "élément trouvé en double").
afterEach(() => {
  cleanup();
});

// Le token JWT est lu au montage de l'AuthProvider ; sans token, l'app se
// comporte comme un visiteur non connecté et ne tente pas d'appel API.
beforeEach(() => {
  window.localStorage.clear();
  window.sessionStorage.clear();
});

function renderWithRouter(ui, initialEntries = ["/"]) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <AuthProvider>
        <Routes>
          <Route path="*" element={ui} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>
  );
}

describe("Menu burger mobile — VisitorLayout (non connecté)", () => {
  it("affiche un bouton burger et un panneau de navigation initialement fermé", () => {
    renderWithRouter(<VisitorLayout />);

    const burger = screen.getByRole("button", { name: /ouvrir le menu/i });
    expect(burger).toBeInTheDocument();

    // Le panneau mobile n'est pas rendu tant qu'on n'a pas cliqué sur le burger
    expect(screen.queryByRole("navigation", { name: "" })).toBeTruthy(); // nav desktop toujours présente dans le DOM
    expect(document.querySelector(".mobile-nav-panel")).not.toBeInTheDocument();
  });

  it("ouvre le panneau de navigation au clic sur le burger, avec tous les liens", async () => {
    const user = userEvent.setup();
    renderWithRouter(<VisitorLayout />);

    await user.click(screen.getByRole("button", { name: /ouvrir le menu/i }));

    const panel = document.querySelector(".mobile-nav-panel");
    expect(panel).toBeInTheDocument();

    const linksInPanel = within(panel).getAllByRole("link");
    // 5 liens de nav (Accueil, Annonces, Messagerie, Facturation, Contact) + Connexion + Inscription
    expect(linksInPanel.length).toBe(7);

    // Le bouton devient "Fermer le menu" une fois ouvert
    expect(screen.getByRole("button", { name: /fermer le menu/i })).toBeInTheDocument();
  });

  it("referme le panneau au clic sur un lien (changement de route)", async () => {
    const user = userEvent.setup();
    renderWithRouter(<VisitorLayout />);

    await user.click(screen.getByRole("button", { name: /ouvrir le menu/i }));
    expect(document.querySelector(".mobile-nav-panel")).toBeInTheDocument();

    const panel = document.querySelector(".mobile-nav-panel");
    await user.click(within(panel).getByRole("link", { name: /^annonces$/i }));

    // La navigation a eu lieu -> useEffect sur location.pathname referme le panneau
    expect(document.querySelector(".mobile-nav-panel")).not.toBeInTheDocument();
  });
});

describe("Menu burger mobile — UserHeaderLayout (connecté)", () => {
  // On simule un utilisateur déjà authentifié en posant un token valide
  // avant le montage, pour éviter de dépendre de l'API de login.
  function primeAuthenticatedSession() {
    const fakeJwt =
      "eyJhbGciOiJIUzI1NiJ9." +
      btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600 })) +
      ".signature";
    window.localStorage.setItem("auth_token", fakeJwt);
  }

  it("affiche le bouton burger et le panneau contient aussi le bouton Déconnexion", async () => {
    primeAuthenticatedSession();
    const user = userEvent.setup();
    renderWithRouter(<UserHeaderLayout />, ["/listings/catalog"]);

    const burger = await screen.findByRole("button", { name: /ouvrir le menu/i });
    await user.click(burger);

    const panel = document.querySelector(".mobile-nav-panel");
    expect(panel).toBeInTheDocument();
    expect(within(panel).getByRole("button", { name: /déconnexion/i })).toBeInTheDocument();
  });
});
