import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/shared/utils';

interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface PageHeaderProps {
  /**
   * Judul halaman utama
   */
  title: string;

  /**
   * Deskripsi atau subtitle halaman
   */
  description?: string;

  /**
   * Breadcrumb navigation items
   */
  breadcrumbs?: BreadcrumbItem[];

  /**
   * Action buttons atau komponen lain di sebelah kanan
   */
  actions?: React.ReactNode;

  /**
   * Additional content di bawah title dan description
   */
  children?: React.ReactNode;

  /**
   * Custom className untuk wrapper
   */
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  breadcrumbs,
  actions,
  children,
  className,
}) => {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm">
            {breadcrumbs.map((item, index) => {
              const isLast = index === breadcrumbs.length - 1;

              return (
                <li key={index} className="flex items-center gap-2">
                  {item.href && !isLast ? (
                    <a
                      href={item.href}
                      className={cn(
                        'text-gray-600 hover:text-gray-900 transition-colors',
                        'focus:outline-none focus:underline'
                      )}
                    >
                      {item.label}
                    </a>
                  ) : (
                    <span
                      className={cn(
                        isLast ? 'text-gray-900 font-medium' : 'text-gray-600'
                      )}
                      aria-current={isLast ? 'page' : undefined}
                    >
                      {item.label}
                    </span>
                  )}

                  {!isLast && (
                    <ChevronRight
                      className="w-4 h-4 text-gray-400"
                      aria-hidden="true"
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      {/* Title and Actions Row */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        {/* Title and Description */}
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl font-semibold text-gray-900 md:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-2 text-base text-gray-600">{description}</p>
          )}
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex items-center gap-3 shrink-0">{actions}</div>
        )}
      </div>

      {/* Additional Content */}
      {children && <div className="pt-2">{children}</div>}
    </div>
  );
};
