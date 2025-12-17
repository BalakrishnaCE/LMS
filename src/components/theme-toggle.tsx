import { Moon, Sun } from "lucide-react"
import { useTheme } from "@/components/theme-provider"
import { useEffect, useState } from "react"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [isDark, setIsDark] = useState(false)

  // Determine current theme state (handle system theme)
  useEffect(() => {
    const checkTheme = () => {
      const root = document.documentElement
      const isDarkMode = root.classList.contains("dark")
      setIsDark(isDarkMode)
    }
    
    checkTheme()
    
    // Watch for theme changes
    const observer = new MutationObserver(checkTheme)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
    
    return () => observer.disconnect()
  }, [theme])

  const toggleTheme = () => {
    const newTheme = isDark ? "light" : "dark"
    setTheme(newTheme)
  }

  return (
    <button
      onClick={toggleTheme}
      className={`relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm ${
        isDark ? "bg-white" : "bg-[#018790]"
      }`}
      aria-label="Toggle theme"
    >
      {/* Toggle thumb/slider */}
      <span
        className={`inline-flex h-4 w-4 transform rounded-full shadow-md transition-transform duration-300 ease-in-out items-center justify-center ${
          isDark ? "translate-x-6 bg-[#018790]" : "translate-x-0.5 bg-white"
        }`}
      >
        {isDark ? (
          <Moon className="h-2.5 w-2.5 text-white flex-shrink-0" />
        ) : (
          <Sun className="h-2.5 w-2.5 text-black flex-shrink-0" />
        )}
      </span>
    </button>
  )
} 