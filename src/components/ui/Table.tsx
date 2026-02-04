/**
 * Table - Composant tokenisé avec couleurs sémantiques
 * 
 * Usage des tokens C1-C10 via getSemanticColors()
 * Aucune couleur hardcodée
 */

import React from 'react';
import { useTheme } from '../../settings/ThemeProvider';
import { getSemanticColors } from '../../styles/semanticColors';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  children: React.ReactNode;
  striped?: boolean;
  hoverable?: boolean;
}

export const Table: React.FC<TableProps> & {
  Head: React.FC<TableHeadProps>;
  Body: React.FC<TableBodyProps>;
  Row: React.FC<TableRowProps>;
  Header: React.FC<TableHeaderProps>;
  Cell: React.FC<TableCellProps>;
} = ({
  children,
  striped = false,
  hoverable = true,
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const semantic = getSemanticColors(colors);

  const tableStyles: React.CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
    lineHeight: '1.5',
    color: semantic['text-primary'],
    backgroundColor: semantic['surface-card'],
    borderRadius: '8px',
    overflow: 'hidden',
  };

  return (
    <table
      data-striped={striped}
      data-hoverable={hoverable}
      style={{ ...tableStyles, ...style }}
      {...props}
    >
      {children}
    </table>
  );
};

interface TableHeadProps {
  children: React.ReactNode;
}

const TableHead: React.FC<TableHeadProps> = ({ children }) => {
  const { colors } = useTheme();
  const semantic = getSemanticColors(colors);

  const headStyles: React.CSSProperties = {
    backgroundColor: semantic['surface-raised'],
    borderBottom: `2px solid ${semantic['border-strong']}`,
  };

  return <thead style={headStyles}>{children}</thead>;
};

interface TableBodyProps {
  children: React.ReactNode;
}

const TableBody: React.FC<TableBodyProps> = ({ children }) => {
  return <tbody>{children}</tbody>;
};

interface TableRowProps extends React.HTMLAttributes<HTMLTableRowElement> {
  children: React.ReactNode;
  index?: number;
}

const TableRow: React.FC<TableRowProps> = ({ children, index = 0, style, ...props }) => {
  const { colors } = useTheme();
  const semantic = getSemanticColors(colors);

  const baseStyles: React.CSSProperties = {
    borderBottom: `1px solid ${semantic['border-default']}`,
    transition: 'background-color 0.15s ease',
  };

  const stripedStyles: React.CSSProperties =
    index % 2 === 1
      ? { backgroundColor: semantic['surface-page'] }
      : { backgroundColor: semantic['surface-card'] };

  const [isHovered, setIsHovered] = React.useState(false);

  const hoverStyles: React.CSSProperties = isHovered
    ? { backgroundColor: semantic['surface-overlay'] }
    : {};

  return (
    <tr
      style={{
        ...baseStyles,
        ...stripedStyles,
        ...hoverStyles,
        ...style,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      {...props}
    >
      {children}
    </tr>
  );
};

interface TableHeaderProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
}

const TableHeader: React.FC<TableHeaderProps> = ({
  children,
  align = 'left',
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const semantic = getSemanticColors(colors);

  const thStyles: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: align,
    fontWeight: 600,
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    color: semantic['text-secondary'],
    whiteSpace: 'nowrap',
  };

  return (
    <th style={{ ...thStyles, ...style }} {...props}>
      {children}
    </th>
  );
};

interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right';
  variant?: 'default' | 'numeric' | 'accent';
}

const TableCell: React.FC<TableCellProps> = ({
  children,
  align = 'left',
  variant = 'default',
  style,
  ...props
}) => {
  const { colors } = useTheme();
  const semantic = getSemanticColors(colors);

  const baseStyles: React.CSSProperties = {
    padding: '12px 16px',
    textAlign: align,
    color: semantic['text-primary'],
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {},
    numeric: {
      fontVariantNumeric: 'tabular-nums',
      fontFamily: 'monospace',
    },
    accent: {
      color: semantic['accent-line'],
      fontWeight: 500,
    },
  };

  return (
    <td style={{ ...baseStyles, ...variantStyles[variant], ...style }} {...props}>
      {children}
    </td>
  );
};

Table.Head = TableHead;
Table.Body = TableBody;
Table.Row = TableRow;
Table.Header = TableHeader;
Table.Cell = TableCell;

export default Table;
