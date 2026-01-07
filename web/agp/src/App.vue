<template>
  <div id="app">
    <header class="app-header">
      <div class="container">
        <div class="header-content">
          <h1 class="app-title">
            <span class="icon">🔭</span>
            Astro Guiding Performance
          </h1>
          <button
            class="mobile-menu-toggle"
            @click="isMobileMenuOpen = !isMobileMenuOpen"
            :class="{ 'active': isMobileMenuOpen }"
          >
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
            <span class="hamburger-line"></span>
          </button>
          <nav class="app-nav" :class="{ 'mobile-open': isMobileMenuOpen }">
            <router-link to="/" class="nav-link" @click="closeMobileMenu">Home</router-link>
            <router-link to="/phd" class="nav-link" @click="closeMobileMenu">PHD Analysis</router-link>
            <router-link to="/telescope-sim" class="nav-link" @click="closeMobileMenu">Telescope Simulator</router-link>
            <router-link to="/session-planning" class="nav-link" @click="closeMobileMenu">Session Planning</router-link>
            <router-link to="/multi-session" class="nav-link" @click="closeMobileMenu">Multi-Session</router-link>
            <router-link to="/equipment" class="nav-link" @click="closeMobileMenu">Equipment</router-link>
            <router-link to="/methodology" class="nav-link" @click="closeMobileMenu">Methodology</router-link>
          </nav>
        </div>
      </div>
    </header>
    <main class="main-content">
      <div class="container">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, onUnmounted } from 'vue';

export default defineComponent({
  name: 'App',
  setup() {
    const isMobileMenuOpen = ref(false);

    const closeMobileMenu = () => {
      isMobileMenuOpen.value = false;
    };

    const handleClickOutside = (event: Event) => {
      const target = event.target as HTMLElement;
      const header = document.querySelector('.app-header');

      if (isMobileMenuOpen.value && header && !header.contains(target)) {
        closeMobileMenu();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isMobileMenuOpen.value) {
        closeMobileMenu();
      }
    };

    onMounted(() => {
      document.addEventListener('click', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    });

    onUnmounted(() => {
      document.removeEventListener('click', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    });

    return {
      isMobileMenuOpen,
      closeMobileMenu,
    };
  },
});
</script>

<style>
:root {
  --primary-color: #667eea;
  --primary-hover: #5a67d8;
  --primary-dark: #5a67d8;
  --secondary-color: #764ba2;
  --accent-color: #f093fb;
  --success-color: #48bb78;
  --warning-color: #ed8936;
  --error-color: #f56565;
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  --white: #ffffff;
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --border-radius: 0.5rem;
  --border-radius-lg: 0.75rem;
  --transition: all 0.2s ease-in-out;

  /* Additional variables for equipment components */
  --bg-color: #f9fafb;
  --text-color: #1f2937;
  --text-muted: #6b7280;
  --card-bg: #ffffff;
  --border-color: #e5e7eb;
  --hover-bg: #f3f4f6;
  --input-bg: #ffffff;
  --disabled-bg: #f9fafb;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: linear-gradient(135deg, var(--gray-50) 0%, var(--gray-100) 100%);
  min-height: 100vh;
}

#app {
  font-family: 'Inter', 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: var(--gray-800);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.app-header {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
  box-shadow: var(--shadow-lg);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem 0;
  flex-wrap: wrap;
  gap: 1rem;
}

.app-title {
  color: var(--white);
  font-size: 1.5rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.app-title .icon {
  font-size: 2rem;
}

.app-nav {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav-link {
  color: var(--white);
  text-decoration: none;
  font-weight: 500;
  padding: 0.5rem 1rem;
  border-radius: var(--border-radius);
  transition: var(--transition);
  position: relative;
}

.nav-link:hover {
  background-color: rgba(255, 255, 255, 0.1);
  transform: translateY(-1px);
}

.nav-link.router-link-exact-active {
  background-color: rgba(255, 255, 255, 0.2);
  font-weight: 600;
}

.nav-link.router-link-exact-active::after {
  content: '';
  position: absolute;
  bottom: -0.25rem;
  left: 50%;
  transform: translateX(-50%);
  width: 2rem;
  height: 2px;
  background-color: var(--accent-color);
  border-radius: 1px;
}

.main-content {
  flex: 1;
  padding: 2rem 0;
}

/* Utility classes */
.card {
  background: var(--white);
  border-radius: var(--border-radius-lg);
  box-shadow: var(--shadow);
  padding: 1.5rem;
  transition: var(--transition);
}

.card:hover {
  box-shadow: var(--shadow-md);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: var(--border-radius);
  font-weight: 500;
  text-decoration: none;
  transition: var(--transition);
  cursor: pointer;
  gap: 0.5rem;
}

.btn-primary {
  background: linear-gradient(135deg, var(--primary-color) 0%, var(--primary-dark) 100%);
  color: var(--white);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.btn-secondary {
  background-color: var(--gray-200);
  color: var(--gray-700);
}

.btn-secondary:hover {
  background-color: var(--gray-300);
}

/* Mobile menu toggle button */
.mobile-menu-toggle {
  display: none;
  flex-direction: column;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  gap: 0.25rem;
  z-index: 101;
}

.mobile-menu-toggle:focus {
  outline: 2px solid rgba(255, 255, 255, 0.5);
  outline-offset: 2px;
}

.hamburger-line {
  width: 24px;
  height: 2px;
  background-color: var(--white);
  transition: all 0.3s ease;
  transform-origin: center;
}

.mobile-menu-toggle.active .hamburger-line:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.mobile-menu-toggle.active .hamburger-line:nth-child(2) {
  opacity: 0;
}

.mobile-menu-toggle.active .hamburger-line:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -6px);
}

@media (max-width: 768px) {
  .header-content {
    flex-wrap: nowrap;
    justify-content: space-between;
  }

  .mobile-menu-toggle {
    display: flex;
  }

  .app-nav {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%);
    flex-direction: column;
    gap: 0;
    padding: 1rem 0;
    box-shadow: var(--shadow-lg);
    transform: translateY(-100%);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    z-index: 100;
  }

  .app-nav.mobile-open {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }

  .nav-link {
    display: block;
    padding: 0.75rem 1.5rem;
    border-radius: 0;
    margin: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .nav-link:last-child {
    border-bottom: none;
  }

  .nav-link.router-link-exact-active::after {
    display: none;
  }

  .nav-link.router-link-exact-active {
    background-color: rgba(255, 255, 255, 0.2);
    border-left: 4px solid var(--accent-color);
  }

  .container {
    padding: 0 0.75rem;
  }
}

@media (max-width: 480px) {
  .app-title {
    font-size: 1.25rem;
  }

  .app-title .icon {
    font-size: 1.5rem;
  }

  .container {
    padding: 0 0.5rem;
  }
}
</style>
