import React, { createContext, useContext, useState } from "react";
import { DashboardFilters } from "@/types";

interface FilterContextType {
  filters: DashboardFilters;
  updateFilters: (updates: Partial<DashboardFilters>) => void;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export const FilterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [filters, setFilters] = useState<DashboardFilters>({
    period: "mes",
    products: [],
    tankIds: [],
    siteIds: [],
    operatorIds: [],
    movementTypes: [],
  });

  const updateFilters = (updates: Partial<DashboardFilters>) => {
    setFilters(prev => ({ ...prev, ...updates }));
  };

  return (
    <FilterContext.Provider value={{ filters, updateFilters }}>
      {children}
    </FilterContext.Provider>
  );
};

export const useFilters = () => {
  const context = useContext(FilterContext);
  if (!context) throw new Error("useFilters must be used within FilterProvider");
  return context;
};
