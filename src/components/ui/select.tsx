import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";
import {
  ChevronDown,
  X,
  Check,
  Search,
  AlertCircle,
  CheckCircle,
} from "lucide-react";

const selectVariants = cva(
  "flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      variant: {
        default: "border-neutral-200 dark:border-neutral-700",
        error: "border-error-500 focus:ring-error-500",
        success: "border-success-500 focus:ring-success-500",
        warning: "border-warning-500 focus:ring-warning-500",
      },
      size: {
        sm: "h-8 px-2 text-xs",
        md: "h-10 px-3",
        lg: "h-12 px-4 text-base",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface SelectOption {
  id: string;
  name: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "size">,
    VariantProps<typeof selectVariants> {
  options: SelectOption[];
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  placeholder?: string;
  label?: string;
  description?: string;
  error?: string;
  success?: string;
  warning?: string;
  required?: boolean;
  disabled?: boolean;
  searchable?: boolean;
  multiple?: boolean;
  clearable?: boolean;
  maxSelected?: number;
  closeOnSelectSingle?: boolean;
  maxTagCount?: number; // for multiple display truncation
}

const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  (
    {
      className,
      variant,
      size,
      options,
      value,
      defaultValue,
      onValueChange,
      placeholder = "Select an option...",
      label,
      description,
      error,
      success,
      warning,
      required,
      disabled,
      searchable = false,
      multiple = false,
      clearable = false,
      maxSelected,
      closeOnSelectSingle = true,
      maxTagCount,
      id,
      ...props
    },
    ref
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isOpen, setIsOpen] = React.useState(false);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [dropdownPosition, setDropdownPosition] = React.useState<
      "top" | "bottom"
    >("bottom");
    const [selectedValues, setSelectedValues] = React.useState<string[]>(() => {
      const initialValue = value || defaultValue;
      if (multiple) {
        return Array.isArray(initialValue)
          ? initialValue
          : initialValue
          ? [initialValue]
          : [];
      }
      return initialValue ? [initialValue as string] : [];
    });

    // Keep internal state in sync when controlled value changes
    React.useEffect(() => {
      if (typeof value === "undefined") return;
      if (multiple) {
        setSelectedValues(Array.isArray(value) ? value : value ? [value] : []);
      } else {
        setSelectedValues(value ? [value as string] : []);
      }
    }, [value, multiple]);

    const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
    const descriptionId = description ? `${selectId}-description` : undefined;
    const errorId = error ? `${selectId}-error` : undefined;
    const successId = success ? `${selectId}-success` : undefined;
    const warningId = warning ? `${selectId}-warning` : undefined;

    // Function to calculate dropdown position based on available space
    const calculateDropdownPosition = React.useCallback(() => {
      if (!containerRef.current) return "bottom";

      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 240; // max-h-60 = 240px
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // If there's enough space below, show below
      if (spaceBelow >= dropdownHeight) {
        return "bottom";
      }

      // If there's more space above than below, show above
      if (spaceAbove > spaceBelow) {
        return "top";
      }

      // Default to bottom if space is equal or very limited
      return "bottom";
    }, []);

    const finalVariant = error
      ? "error"
      : success
      ? "success"
      : warning
      ? "warning"
      : variant;

    const filteredOptions = React.useMemo(() => {
      if (!searchable || !searchTerm) return options;
      return options?.filter((option) =>
        option?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }, [options, searchTerm, searchable]);

    const selectedOptions = React.useMemo(() => {
      return options.filter((option) => selectedValues.includes(option?.id));
    }, [options, selectedValues]);

    const handleSelect = (optionValue: string) => {
      let newValues: string[];

      if (multiple) {
        if (selectedValues.includes(optionValue)) {
          newValues = selectedValues.filter((v) => v !== optionValue);
        } else {
          if (maxSelected && selectedValues.length >= maxSelected) {
            return;
          }
          newValues = Array.from(new Set([...selectedValues, optionValue]));
        }
      } else {
        if (selectedValues.includes(optionValue)) {
          newValues = [];
        } else {
          newValues = [optionValue];
        }

        if (closeOnSelectSingle) setIsOpen(false);
      }

      setSelectedValues(newValues);
      onValueChange?.(multiple ? newValues : newValues[0] || "");
    };

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedValues([]);
      onValueChange?.(multiple ? [] : "");
    };

    const handleRemoveChip = (valueToRemove: string, e: React.MouseEvent) => {
      e.stopPropagation();
      const newValues = selectedValues.filter((v) => v !== valueToRemove);
      setSelectedValues(newValues);
      onValueChange?.(multiple ? newValues : newValues[0] || "");
    };

    const getStateIcon = () => {
      if (error) return <AlertCircle className="h-4 w-4 text-red-500" />;
      if (success) return <CheckCircle className="h-4 w-4 text-green-500" />;
      if (warning) return <AlertCircle className="h-4 w-4 text-orange-500" />;
      return null;
    };

    const getStateMessage = () => {
      if (error)
        return {
          message: error,
          id: errorId,
          className: "text-red-600 dark:text-red-400",
        };
      if (success)
        return {
          message: success,
          id: successId,
          className: "text-green-600 dark:text-green-400",
        };
      if (warning)
        return {
          message: warning,
          id: warningId,
          className: "text-orange-600 dark:text-orange-400",
        };
      return null;
    };

    const stateMessage = getStateMessage();
    const ariaDescribedBy =
      [descriptionId, stateMessage?.id].filter(Boolean).join(" ") || undefined;

    // Calculate dropdown position when it opens
    React.useEffect(() => {
      if (isOpen) {
        const position = calculateDropdownPosition();
        setDropdownPosition(position);
      }
    }, [isOpen, calculateDropdownPosition]);

    React.useEffect(() => {
      const handleClickOutside = (event: MouseEvent | TouchEvent) => {
        const node = containerRef.current;
        if (node && !node.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
        document.removeEventListener("touchstart", handleClickOutside);
      };
    }, []);

    // Merge internal and forwarded refs
    const setRefs = (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (!ref) return;
      if (typeof ref === "function") {
        ref(node);
      } else {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    };

    return (
      <div className="w-full z-10">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium leading-6 text-gray-700 mb-2"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {description && (
          <p id={descriptionId} className="text-sm text-gray-600 mb-2">
            {description}
          </p>
        )}

        <div className="relative" ref={setRefs}>
          <div
            className={cn(
              selectVariants({ variant: finalVariant, size }),
              "cursor-pointer",
              disabled && "cursor-not-allowed",
              className
            )}
            onClick={() => !disabled && setIsOpen(!isOpen)}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-describedby={ariaDescribedBy}
            role="combobox"
            {...props}
          >
            <div className="flex-1 flex items-center gap-1 overflow-hidden">
              {selectedOptions.length === 0 ? (
                <span className="text-gray-700">{placeholder}</span>
              ) : multiple ? (
                <div className="flex flex-wrap gap-1 items-center  overflow-hidden max-h-16">
                  {selectedOptions
                    ?.slice(
                      0,
                      typeof maxTagCount === "number" ? maxTagCount : 2
                    )
                    ?.map((option) => (
                      <span
                        key={option?.id}
                        className="inline-flex items-center gap-1 px-2 py-0.5  text-gray-800 text-sm rounded-md"
                      >
                        {option?.name}
                        <button
                          type="button"
                          onClick={(e) => handleRemoveChip(option?.id, e)}
                          className="hover:bg-purple-50 cursor-pointer rounded-full p-0.5"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </span>
                    ))}
                  {(typeof maxTagCount === "number" ? maxTagCount : 2) <
                  selectedOptions.length ? (
                    <span className="inline-flex items-center rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-600 inset-ring inset-ring-gray-500/10">
                      +
                      {selectedOptions.length -
                        (typeof maxTagCount === "number"
                          ? maxTagCount
                          : 2)}{" "}
                      more
                    </span>
                  ) : null}
                </div>
              ) : (
                <span>{selectedOptions?.[0]?.name}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {getStateIcon()}
              {clearable && selectedValues.length > 0 && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-gray-700 hover:text-foreground"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <ChevronDown
                className={cn(
                  "h-5 w-5 text-gray-600 transition-transform",
                  isOpen && "rotate-180"
                )}
              />
            </div>
          </div>

          {isOpen && (
            <div
              className={cn(
                "absolute z-50 w-full bg-white border border-border rounded-md shadow-lg max-h-60 overflow-auto",
                dropdownPosition === "top"
                  ? "bottom-full mb-1"
                  : "top-full mt-1"
              )}
            >
              {searchable && (
                <div className="p-2 top-0 sticky bg-white border-b border-border">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Search options..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-2.5 text-sm text-gray-700 bg-white placeholder:text-gray-400 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-600"
                    />
                  </div>
                </div>
              )}

              <div className="py-1 ">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No options found
                  </div>
                ) : (
                  filteredOptions?.map((option) => (
                    <div
                      key={option?.id}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-gray-100",
                        option.disabled && "opacity-50 cursor-not-allowed",
                        selectedValues?.includes(option?.id) && "bg-purple-100"
                      )}
                      onClick={() =>
                        !option.disabled && handleSelect(option?.id)
                      }
                    >
                      <span>{option?.name}</span>
                      {selectedValues.includes(option?.id) && (
                        <Check className="h-4 w-4 text-primary-600" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="mt-2">
          {stateMessage && (
            <p
              id={stateMessage.id}
              className={cn("text-sm", stateMessage.className)}
            >
              {stateMessage.message}
            </p>
          )}
        </div>
      </div>
    );
  }
);

Select.displayName = "Select";

export { Select, selectVariants };
