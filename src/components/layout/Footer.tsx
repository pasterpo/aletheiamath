import { Link } from 'react-router-dom';
import { Mail, Youtube, ExternalLink } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-secondary/30">
      <div className="container py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 md:gap-12">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-serif font-bold text-lg">α</span>
              </div>
              <span className="font-serif text-xl font-semibold tracking-tight text-foreground">
                AletheiaMath
              </span>
            </Link>
            <p className="text-muted-foreground body-regular max-w-md mb-6">
              Where high-level mathematics becomes understandable and enjoyable. 
              Building mathematical intuition through rigor, clarity, and intellectual depth.
            </p>
            <div className="flex items-center gap-4">
              <a
                href="https://youtube.com/@AletheiaMath"
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="YouTube Channel"
              >
                <Youtube className="h-5 w-5" />
              </a>
              <a
                href="mailto:contact@aletheiamath.org"
                className="text-muted-foreground hover:text-primary transition-colors"
                aria-label="Email"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif font-semibold text-foreground mb-4">Quick Links</h4>
            <ul className="space-y-3">
              <li>
                <Link 
                  to="/" 
                  className="text-muted-foreground hover:text-primary transition-colors body-small"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link 
                  to="/about" 
                  className="text-muted-foreground hover:text-primary transition-colors body-small"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link 
                  to="/contact" 
                  className="text-muted-foreground hover:text-primary transition-colors body-small"
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-serif font-semibold text-foreground mb-4">Contact</h4>
            <ul className="space-y-3 text-muted-foreground body-small">
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p>General Inquiries</p>
                  <a 
                    href="mailto:contact@aletheiamath.org" 
                    className="hover:text-primary transition-colors"
                  >
                    contact@aletheiamath.org
                  </a>
                </div>
              </li>
              <li className="flex items-start gap-2">
                <ExternalLink className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p>Response Time</p>
                  <span>Within 48 hours</span>
                </div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-border mt-8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-muted-foreground body-small">
            © {currentYear} AletheiaMath. All rights reserved.
          </p>
          <p className="text-muted-foreground body-small italic">
            "ἀλήθεια" — Truth through understanding
          </p>
        </div>
      </div>
    </footer>
  );
}