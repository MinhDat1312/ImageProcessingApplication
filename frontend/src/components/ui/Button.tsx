import React from 'react';
import { Button as AntButton } from 'antd';
import type { ButtonProps as AntButtonProps } from 'antd';
import '../../styles/design-tokens.css';

export type DnaButtonProps = Omit<AntButtonProps, 'variant'> & {
  variant?: 'primary' | 'secondary' | 'ghost';
}

export const Button: React.FC<DnaButtonProps> = ({ variant = 'primary', className, children, ...rest }) => {
  const classes = ['dna-btn'];
  if (variant === 'primary') classes.push('dna-btn-primary');
  if (variant === 'secondary') classes.push('dna-btn-secondary');
  if (variant === 'ghost') classes.push('dna-btn-ghost');
  if (className) classes.push(className);

  const antType = variant === 'primary' ? 'primary' : variant === 'ghost' ? 'text' : 'default';

  return (
    <AntButton 
      className={classes.join(' ')} 
      type={antType} 
      {...rest}
    >
      {children}
    </AntButton>
  );
};

export default Button;
