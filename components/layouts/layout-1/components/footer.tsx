import { generalSettings } from '@/config/general.config';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-center md:justify-between items-center gap-3 py-5">
          <div className="flex order-2 md:order-1  gap-2 font-normal text-sm">
            <span className="text-muted-foreground">{currentYear} &copy;</span>
            <a
              href="https://www.iepc-chiapas.org.mx"
              target="_blank"
              className="text-secondary-foreground hover:text-primary"
            >
              Instituto de Elecciones y Participación Ciudadana
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
