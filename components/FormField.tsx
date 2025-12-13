'use client';

import { useState, useEffect, useCallback, ReactNode, forwardRef, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { AlertCircle, Check, Loader2 } from 'lucide-react';

// Validation types
type ValidationRule = {
  validate: (value: string) => boolean;
  message: string;
};

interface FormFieldProps {
  label: string;
  error?: string;
  hint?: string;
  success?: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

export function FormField({ 
  label, 
  error, 
  hint, 
  success, 
  required = false, 
  children,
  className = '' 
}: FormFieldProps) {
  return (
    <div className={`form-field ${error ? 'form-field-error' : ''} ${className}`}>
      <label className="form-label">
        {label}
        {required && <span style={{ color: 'var(--danger)', marginLeft: '0.25rem' }}>*</span>}
      </label>
      {children}
      {error && (
        <div className="form-error">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}
      {success && !error && (
        <div className="form-success">
          <Check size={14} />
          <span>{success}</span>
        </div>
      )}
      {hint && !error && !success && (
        <div className="form-hint">{hint}</div>
      )}
    </div>
  );
}

// Validated Input
interface ValidatedInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  rules?: ValidationRule[];
  hint?: string;
  showValidation?: boolean;
}

export const ValidatedInput = forwardRef<HTMLInputElement, ValidatedInputProps>(
  ({ label, rules = [], hint, showValidation = true, required, className = '', onChange, onBlur, ...props }, ref) => {
    const [error, setError] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);
    const [value, setValue] = useState(props.value || props.defaultValue || '');

    const validate = useCallback((val: string) => {
      if (required && !val.trim()) {
        return 'This field is required';
      }
      for (const rule of rules) {
        if (!rule.validate(val)) {
          return rule.message;
        }
      }
      return null;
    }, [required, rules]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      
      if (touched && showValidation) {
        setError(validate(newValue));
      }
      
      onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
      setTouched(true);
      if (showValidation) {
        setError(validate(e.target.value));
      }
      onBlur?.(e);
    };

    return (
      <FormField label={label} error={touched ? error || undefined : undefined} hint={hint} required={required}>
        <input
          ref={ref}
          className={`form-input ${className}`}
          onChange={handleChange}
          onBlur={handleBlur}
          value={value}
          {...props}
        />
      </FormField>
    );
  }
);

ValidatedInput.displayName = 'ValidatedInput';

// Validated Select
interface ValidatedSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
  options: Array<{ value: string; label: string; disabled?: boolean }>;
  hint?: string;
  placeholder?: string;
}

export const ValidatedSelect = forwardRef<HTMLSelectElement, ValidatedSelectProps>(
  ({ label, options, hint, placeholder, required, className = '', ...props }, ref) => {
    const [error, setError] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);

    const handleBlur = (e: React.FocusEvent<HTMLSelectElement>) => {
      setTouched(true);
      if (required && !e.target.value) {
        setError('Please select an option');
      } else {
        setError(null);
      }
      props.onBlur?.(e);
    };

    return (
      <FormField label={label} error={touched ? error || undefined : undefined} hint={hint} required={required}>
        <select
          ref={ref}
          className={`form-select ${className}`}
          onBlur={handleBlur}
          {...props}
        >
          {placeholder && <option value="">{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
      </FormField>
    );
  }
);

ValidatedSelect.displayName = 'ValidatedSelect';

// Validated Textarea
interface ValidatedTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  rules?: ValidationRule[];
  hint?: string;
  showCount?: boolean;
}

export const ValidatedTextarea = forwardRef<HTMLTextAreaElement, ValidatedTextareaProps>(
  ({ label, rules = [], hint, showCount = false, required, maxLength, className = '', ...props }, ref) => {
    const [error, setError] = useState<string | null>(null);
    const [touched, setTouched] = useState(false);
    const [charCount, setCharCount] = useState(0);

    const validate = useCallback((val: string) => {
      if (required && !val.trim()) {
        return 'This field is required';
      }
      for (const rule of rules) {
        if (!rule.validate(val)) {
          return rule.message;
        }
      }
      return null;
    }, [required, rules]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setCharCount(e.target.value.length);
      if (touched) {
        setError(validate(e.target.value));
      }
      props.onChange?.(e);
    };

    const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
      setTouched(true);
      setError(validate(e.target.value));
      props.onBlur?.(e);
    };

    return (
      <FormField 
        label={label} 
        error={touched ? error || undefined : undefined} 
        hint={showCount && maxLength ? `${charCount}/${maxLength} characters` : hint} 
        required={required}
      >
        <textarea
          ref={ref}
          className={`form-input ${className}`}
          style={{ minHeight: 100, resize: 'vertical' }}
          onChange={handleChange}
          onBlur={handleBlur}
          maxLength={maxLength}
          {...props}
        />
      </FormField>
    );
  }
);

ValidatedTextarea.displayName = 'ValidatedTextarea';

// Auto-save indicator
interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  className?: string;
}

export function AutoSaveIndicator({ status, className = '' }: AutoSaveIndicatorProps) {
  if (status === 'idle') return null;

  return (
    <div className={`autosave-indicator ${status} ${className}`}>
      {status === 'saving' && (
        <>
          <Loader2 size={14} className="animate-spin" />
          <span>Saving...</span>
        </>
      )}
      {status === 'saved' && (
        <>
          <Check size={14} />
          <span>Saved</span>
        </>
      )}
      {status === 'error' && (
        <>
          <AlertCircle size={14} />
          <span>Error saving</span>
        </>
      )}
    </div>
  );
}

// Common validation rules
export const validationRules = {
  email: {
    validate: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    message: 'Please enter a valid email address',
  },
  phone: {
    validate: (value: string) => /^\+?[\d\s-]{8,}$/.test(value),
    message: 'Please enter a valid phone number',
  },
  minLength: (min: number): ValidationRule => ({
    validate: (value: string) => value.length >= min,
    message: `Must be at least ${min} characters`,
  }),
  maxLength: (max: number): ValidationRule => ({
    validate: (value: string) => value.length <= max,
    message: `Must be no more than ${max} characters`,
  }),
  numeric: {
    validate: (value: string) => /^\d+$/.test(value),
    message: 'Please enter numbers only',
  },
  decimal: {
    validate: (value: string) => /^\d+\.?\d*$/.test(value),
    message: 'Please enter a valid number',
  },
};

// Hook for form auto-save
export function useAutoSave(
  saveFunction: () => Promise<void>,
  deps: unknown[],
  delay: number = 1000
) {
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (deps.some(d => d !== undefined && d !== null && d !== '')) {
      setStatus('saving');
      
      const timeout = setTimeout(async () => {
        try {
          await saveFunction();
          setStatus('saved');
          setTimeout(() => setStatus('idle'), 2000);
        } catch {
          setStatus('error');
        }
      }, delay);

      return () => clearTimeout(timeout);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return status;
}

