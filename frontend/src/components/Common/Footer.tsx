import { FaGithub } from "react-icons/fa"

const creators = [
  { username: "kenetcode", name: "Kenet Ortiz" },
  { username: "CarlosRauda64", name: "Carlos Rauda" },
]

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t py-5 px-6">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
        <p className="text-muted-foreground text-sm">
          YourBank - Compara productos bancarios · {currentYear}
        </p>

        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-muted-foreground">
            Creado por
          </span>
          <div className="flex items-center gap-2">
            {creators.map((creator) => (
              <a
                key={creator.username}
                href={`https://github.com/${creator.username}`}
                target="_blank"
                rel="noopener noreferrer"
                title={creator.name}
                className="group flex items-center gap-2 rounded-full border bg-muted/40 py-1 pr-3 pl-1 transition-colors hover:border-primary/40 hover:bg-primary/5"
              >
                <img
                  src={`https://github.com/${creator.username}.png?size=64`}
                  alt={creator.name}
                  className="size-6 rounded-full ring-1 ring-border"
                  loading="lazy"
                />
                <span className="flex items-center gap-1 text-xs font-medium text-muted-foreground group-hover:text-foreground">
                  <FaGithub className="size-3" />@{creator.username}
                </span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
