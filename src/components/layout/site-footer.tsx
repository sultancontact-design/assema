import Link from "next/link";
import { Heart, Mail, MapPin, Phone } from "lucide-react";
import { ZelligeDivider } from "@/components/shared/zellige-divider";
import { SiteLogo } from "@/components/shared/site-logo";

const FOOTER_LINKS = {
  community: {
    title: "المجتمع",
    links: [
      { href: "/community", label: "ملخص الحي" },
      { href: "/community/fund", label: "صندوق المعروف" },
      { href: "/community/events", label: "الفعاليات" },
      { href: "/community/groups", label: "المجموعات" },
    ],
  },
  about: {
    title: "عن المنصة",
    links: [
      { href: "/about", label: "من نحن" },
      { href: "/principles", label: "المبادئ" },
      { href: "/privacy", label: "الخصوصية" },
      { href: "/terms", label: "الشروط" },
    ],
  },
  contact: {
    title: "تواصل معنا",
    links: [
      { href: "/contact", label: "اتصل بنا" },
      { href: "/faq", label: "أسئلة شائعة" },
      { href: "/complaints", label: "صندوق الشكاوى" },
    ],
  },
};

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-muted/30">
      <div className="container mx-auto px-4 py-10">
        <ZelligeDivider variant="diamond" className="mb-8 opacity-60" />

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
          {/* العمود الأول — الهوية */}
          <div className="col-span-2 md:col-span-1">
            <SiteLogo size="md" />
            <p className="mt-4 text-sm text-muted-foreground leading-relaxed">
              منصة اجتماعية تضامنية لرقمنة المعروف المغربي في حي سيدي يوسف بن علي
              بمراكش. من حي إلى عاصمة... المعروف الرقمي.
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Heart className="size-3.5 text-primary" />
              <span>صُنع بحب في مراكش</span>
            </div>
          </div>

          {/* باقي الأعمدة */}
          {Object.values(FOOTER_LINKS).map((section) => (
            <nav key={section.title} aria-label={section.title}>
              <h3 className="font-heading font-bold text-sm mb-3 text-foreground">
                {section.title}
              </h3>
              <ul className="space-y-2">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground hover:text-primary transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {/* معلومات الاتصال */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <MapPin className="size-4 text-primary" />
            <span>حي سيدي يوسف بن علي، مراكش، المغرب</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="size-4 text-primary" />
            <span dir="ltr">+212 5XX-XXXXXX</span>
          </div>
          <div className="flex items-center gap-2">
            <Mail className="size-4 text-primary" />
            <span dir="ltr">contact@syba-community.ma</span>
          </div>
        </div>

        <ZelligeDivider variant="minimal" className="mb-6 opacity-50" />

        {/* أسفل الفوتر */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} سيدي يوسف بن علي العاصمة. جميع الحقوق
            محفوظة.
          </p>
          <p className="text-center">
            رخصة الاستخدام: المشروع مفتوح المصدر لخدمة المجتمع
          </p>
        </div>
      </div>
    </footer>
  );
}
