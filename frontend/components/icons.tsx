// Ícones de linha simples (sem dependência externa), no estilo do mockup de
// referência. Todos aceitam o restante das props de um <svg>.
import type { SVGProps } from 'react';

function base(children: React.ReactNode, props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IconHome = (props: SVGProps<SVGSVGElement>) =>
  base(
    <>
      <path d="M3 11.5 12 4l9 7.5" />
      <path d="M5.5 9.5V19a1 1 0 0 0 1 1H10v-5a2 2 0 0 1 2-2v0a2 2 0 0 1 2 2v5h3.5a1 1 0 0 0 1-1V9.5" />
    </>,
    props,
  );

export const IconBell = (props: SVGProps<SVGSVGElement>) =>
  base(
    <>
      <path d="M6 9a6 6 0 1 1 12 0c0 4 1.5 5.5 1.5 5.5H4.5S6 13 6 9Z" />
      <path d="M10 19a2 2 0 0 0 4 0" />
    </>,
    props,
  );

export const IconGrid = (props: SVGProps<SVGSVGElement>) =>
  base(
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>,
    props,
  );

export const IconBuilding = (props: SVGProps<SVGSVGElement>) =>
  base(
    <>
      <rect x="5" y="3" width="14" height="18" rx="1.5" />
      <path d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1" />
      <path d="M10 21v-3.5a2 2 0 0 1 4 0V21" />
    </>,
    props,
  );

export const IconUserPlus = (props: SVGProps<SVGSVGElement>) =>
  base(
    <>
      <circle cx="9" cy="8" r="3.3" />
      <path d="M3 20c0-3.3 2.7-5.5 6-5.5s6 2.2 6 5.5" />
      <path d="M18 8v5M15.5 10.5h5" />
    </>,
    props,
  );

export const IconUser = (props: SVGProps<SVGSVGElement>) =>
  base(
    <>
      <circle cx="12" cy="8" r="3.3" />
      <path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" />
    </>,
    props,
  );

export const IconClipboard = (props: SVGProps<SVGSVGElement>) =>
  base(
    <>
      <rect x="5.5" y="4.5" width="13" height="16" rx="1.5" />
      <path d="M9 4.5V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v.5" />
      <path d="M9 11h6M9 15h6" />
    </>,
    props,
  );

export const IconCreditCard = (props: SVGProps<SVGSVGElement>) =>
  base(
    <>
      <rect x="3" y="5.5" width="18" height="13" rx="2" />
      <path d="M3 9.5h18" />
      <path d="M6.5 14.5h4" />
    </>,
    props,
  );

export const IconCalendar = (props: SVGProps<SVGSVGElement>) =>
  base(
    <>
      <rect x="3.5" y="5" width="17" height="16" rx="2" />
      <path d="M8 3v4M16 3v4M3.5 10h17" />
    </>,
    props,
  );

export const IconUsers = (props: SVGProps<SVGSVGElement>) =>
  base(
    <>
      <circle cx="9" cy="8.5" r="3" />
      <path d="M2.8 19c0-3.2 2.8-5.3 6.2-5.3s6.2 2.1 6.2 5.3" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M15.5 13.5c2.6.2 4.7 2.1 4.7 5" />
    </>,
    props,
  );

export const IconPackage = (props: SVGProps<SVGSVGElement>) =>
  base(
    <>
      <path d="M12 3 4 7v10l8 4 8-4V7l-8-4Z" />
      <path d="M4 7l8 4 8-4M12 11v10" />
    </>,
    props,
  );

export const IconPlus = (props: SVGProps<SVGSVGElement>) =>
  base(<path d="M12 5v14M5 12h14" />, props);

export const IconLogOut = (props: SVGProps<SVGSVGElement>) =>
  base(
    <>
      <path d="M9 21H5.5A1.5 1.5 0 0 1 4 19.5v-15A1.5 1.5 0 0 1 5.5 3H9" />
      <path d="M16 17l5-5-5-5M21 12H9" />
    </>,
    props,
  );

export const IconChevronLeft = (props: SVGProps<SVGSVGElement>) =>
  base(<path d="M15 18l-6-6 6-6" />, props);

export const IconCamera = (props: SVGProps<SVGSVGElement>) =>
  base(
    <>
      <path d="M4 8h3l1.5-2h7L17 8h3a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1Z" />
      <circle cx="12" cy="13" r="3.3" />
    </>,
    props,
  );

export const IconBarChart = (props: SVGProps<SVGSVGElement>) =>
  base(
    <>
      <path d="M5 20V10M12 20V4M19 20v-7" />
    </>,
    props,
  );

export const IconCheck = (props: SVGProps<SVGSVGElement>) => base(<path d="M5 13l4 4L19 7" />, props);

export const IconAlertCircle = (props: SVGProps<SVGSVGElement>) =>
  base(
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v5M12 16h.01" />
    </>,
    props,
  );

export const IconFilter = (props: SVGProps<SVGSVGElement>) =>
  base(<path d="M4 5h16l-6 7.5V19l-4 2v-8.5L4 5Z" />, props);

export const IconSearch = (props: SVGProps<SVGSVGElement>) =>
  base(
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </>,
    props,
  );

export const IconList = (props: SVGProps<SVGSVGElement>) =>
  base(
    <>
      <path d="M8 6h12M8 12h12M8 18h12" />
      <path d="M4 6h.01M4 12h.01M4 18h.01" />
    </>,
    props,
  );

export const IconX = (props: SVGProps<SVGSVGElement>) => base(<path d="M6 6l12 12M18 6L6 18" />, props);
