import React from "react";
import { cn } from "../../lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDown, X, Check, Search } from "lucide-react";

const selectVariants = cva(
  "flex h-10 w-full items-center justify-between rounded-md border border-input bg-white px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
  {
    variants: {
      size: {
        sm: "h-8 px-2 text-xs",
        md: "h-10 px-3",
        lg: "h-12 px-4 text-base",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

export type ViolationOption = {
  id: string;
  offence_cd?: string;
  violation_description?: string;
  wheeler_cd?: string;
  detected_violation?: string;
  disabled?: boolean;
};

export interface ViolationSelectProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "size">,
    VariantProps<typeof selectVariants> {
  options: ViolationOption[];
  value?: string | string[];
  defaultValue?: string | string[];
  onValueChange?: (value: string | string[]) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
  multiple?: boolean;
  clearable?: boolean;
  closeOnSelectSingle?: boolean;
  maxSelected?: number;
  maxTagCount?: number;
  // Modal/inline behaviors
  autoOpen?: boolean; // opens dropdown on mount (useful in modals)
  autoFocusSearch?: boolean; // focuses the search box when opened
  hideTrigger?: boolean; // render only the dropdown + search (no trigger)
  closeOnSelectEach?: boolean; // when multiple, close after each selection
  isOpen?: boolean; // external control of open state
}

const ViolationSelect = React.forwardRef<HTMLDivElement, ViolationSelectProps>(
  (
    {
      className,
      size,
      options,
      value,
      defaultValue,
      onValueChange,
      placeholder = "Select violation...",
      label,
      disabled,
      multiple = false,
      clearable = false,
      closeOnSelectSingle = true,
      maxSelected,
      maxTagCount,
      autoOpen = false,
      autoFocusSearch = true,
      hideTrigger = false,
      closeOnSelectEach = false,
      isOpen: externalIsOpen,
      ...props
    },
    ref
  ) => {
    const containerRef = React.useRef<HTMLDivElement>(null);
    const searchInputRef = React.useRef<HTMLInputElement>(null);
    const [internalIsOpen, setInternalIsOpen] = React.useState<boolean>(
      hideTrigger ? true : autoOpen
    );
    
    // Use external control if provided, otherwise use internal state
    const isOpen = externalIsOpen !== undefined ? externalIsOpen : internalIsOpen;
    const [searchTerm, setSearchTerm] = React.useState("");
    const [dropdownPosition, setDropdownPosition] = React.useState<
      "top" | "bottom"
    >("bottom");
    const [selectedValues, setSelectedValues] = React.useState<string[]>(() => {
      const initialValue = value || defaultValue;
      return Array.isArray(initialValue)
        ? initialValue
        : initialValue
        ? [initialValue]
        : [];
    });
    // sync with external value changes
    React.useEffect(() => {
      if (typeof value === "undefined") return;
      setSelectedValues(Array.isArray(value) ? value : value ? [value] : []);
    }, [value]);

    const calculateDropdownPosition = React.useCallback(() => {
      if (!containerRef.current) return "bottom";
      const rect = containerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const dropdownHeight = 240;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;
      if (spaceBelow >= dropdownHeight) return "bottom";
      if (spaceAbove > spaceBelow) return "top";
      return "bottom";
    }, []);

    React.useEffect(() => {
      if (isOpen) {
        const pos = calculateDropdownPosition();
        setDropdownPosition(pos);
        if (autoFocusSearch) {
          setTimeout(() => searchInputRef.current?.focus(), 0);
        }
      }
    }, [isOpen, calculateDropdownPosition, autoFocusSearch]);

    React.useEffect(() => {
      if (!hideTrigger && !autoOpen) return;
      if (externalIsOpen === undefined) {
        setInternalIsOpen(true);
      }
    }, [hideTrigger, autoOpen, externalIsOpen]);

    React.useEffect(() => {
      const onDocClick = (e: MouseEvent | TouchEvent) => {
        const node = containerRef.current;
        if (node && !node.contains(e.target as Node) && externalIsOpen === undefined) {
          setInternalIsOpen(false);
        }
      };
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("touchstart", onDocClick);
      return () => {
        document.removeEventListener("mousedown", onDocClick);
        document.removeEventListener("touchstart", onDocClick);
      };
    }, [externalIsOpen]);

    // filter options by search
    const filteredOptions = React.useMemo(() => {
      if (!searchTerm) return options;
      const term = searchTerm.toLowerCase();
      return options.filter(
        (opt) =>
          (opt.offence_cd || "").toLowerCase().includes(term) ||
          (opt.violation_description || "").toLowerCase().includes(term)
      );
    }, [options, searchTerm]);

    // selected option objects
    const selectedOptions = React.useMemo(() => {
      return options.filter((opt) => selectedValues.includes(opt.id));
    }, [options, selectedValues]);

    // handle selection (multi only)
    const handleSelect = (optionId: string) => {
      let newValues: string[];

      if (selectedValues.includes(optionId)) {
        newValues = selectedValues.filter((v) => v !== optionId);
      } else {
        if (maxSelected && selectedValues.length >= maxSelected) return;
        newValues = Array.from(new Set([...selectedValues, optionId]));
      }

      setSelectedValues(newValues);
      onValueChange?.(newValues);

      // always close after selection (only if not externally controlled)
      if (externalIsOpen === undefined) {
        setInternalIsOpen(false);
        // clear search so list resets
        setSearchTerm("");
      }
    };
    // clear all selections
    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      setSelectedValues([]);
      onValueChange?.([]);
    };
    // support forwarding refs
    const setRefs = (node: HTMLDivElement | null) => {
      (containerRef as any).current = node;
      if (!ref) return;
      if (typeof ref === "function") ref(node);
      else
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
    };

    return (
      <div className="w-full z-10">
        {label && (
          <label className="block text-sm font-medium leading-6 text-gray-700 mb-2">
            {label}
          </label>
        )}

        <div className="relative" ref={setRefs}>
          {!hideTrigger && (
            <div
              className={cn(
                selectVariants({ size }),
                "cursor-pointer",
                disabled && "cursor-not-allowed",
                className
              )}
              onClick={() => !disabled && externalIsOpen === undefined && setInternalIsOpen(!isOpen)}
              aria-expanded={isOpen}
              aria-haspopup="listbox"
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
                      ?.map((opt) => (
                        <span
                          key={opt.id}
                          className="inline-flex items-center gap-1 px-2 py-0.5  text-gray-800 text-sm rounded-md"
                        >
                          {opt?.violation_description}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSelect(opt.id);
                            }}
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
                  <span>
                    {selectedOptions?.[0]?.offence_cd}
                    {selectedOptions?.[0]?.offence_cd ? " - " : ""}
                    {selectedOptions?.[0]?.violation_description}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
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
          )}

          {isOpen && (
            <div
              className={cn(
                "absolute z-50 w-full bg-white border border-border rounded-md shadow-lg max-h-60 overflow-auto",
                dropdownPosition === "top"
                  ? "bottom-full mb-1"
                  : "top-full mt-1"
              )}
            >
              <div className="p-2 top-0 sticky bg-white border-b border-border">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search by code or description..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 text-sm text-gray-700 bg-white placeholder:text-gray-400 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="py-1 ">
                {filteredOptions.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    No options found
                  </div>
                ) : (
                  filteredOptions?.map((opt) => (
                    <div
                      key={opt.id}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 text-sm cursor-pointer hover:bg-gray-100",
                        opt.disabled && "opacity-50 cursor-not-allowed",
                        selectedValues.includes(opt.id) && "bg-purple-100"
                      )}
                      onClick={() => !opt.disabled && handleSelect(opt.id)}
                    >
                      <span>
                        <span className="font-medium">{opt?.offence_cd}</span>
                        {opt?.offence_cd ? "  -  " : ""}
                        {opt?.violation_description}
                        {/* {opt?.wheeler_cd ? "  -  " : ""}
                        <span className="font-medium">{opt?.wheeler_cd}</span> */}
                      </span>
                      {selectedValues?.includes(opt?.id) && (
                        <Check className="h-4 w-4 text-primary-600" />
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }
);

ViolationSelect.displayName = "ViolationSelect";

export { ViolationSelect };
