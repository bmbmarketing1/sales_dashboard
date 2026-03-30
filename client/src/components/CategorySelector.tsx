import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Filter } from "lucide-react";

interface CategorySelectorProps {
  categories: string[];
  selectedCategories: string[];
  onCategoriesChange: (categories: string[]) => void;
}

export function CategorySelector({
  categories,
  selectedCategories,
  onCategoriesChange,
}: CategorySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tempSelected, setTempSelected] = useState<string[]>(selectedCategories);

  const handleSelectAll = () => {
    if (tempSelected.length === categories.length) {
      setTempSelected([]);
    } else {
      setTempSelected([...categories]);
    }
  };

  const handleToggleCategory = (category: string) => {
    setTempSelected((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
    );
  };

  const handleApply = () => {
    onCategoriesChange(tempSelected);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setTempSelected(selectedCategories);
    setIsOpen(false);
  };

  const displayLabel =
    tempSelected.length === 0
      ? "Todas as categorias"
      : tempSelected.length === categories.length
      ? "Todas as categorias"
      : `${tempSelected.length} categoria${tempSelected.length > 1 ? "s" : ""} selecionada${tempSelected.length > 1 ? "s" : ""}`;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="w-4 h-4" />
          {displayLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Filtrar por Categorias</DialogTitle>
          <DialogDescription>
            Selecione as categorias que deseja incluir no relatório
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Select All Option */}
          <div className="flex items-center space-x-2 border-b pb-3">
            <Checkbox
              id="select-all"
              checked={tempSelected.length === categories.length}
              onCheckedChange={handleSelectAll}
            />
            <Label htmlFor="select-all" className="font-semibold cursor-pointer">
              Selecionar Todas
            </Label>
          </div>

          {/* Category Options */}
          <div className="space-y-3">
            {categories.map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={tempSelected.includes(category)}
                  onCheckedChange={() => handleToggleCategory(category)}
                />
                <Label
                  htmlFor={`category-${category}`}
                  className="cursor-pointer"
                >
                  {category}
                </Label>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="text-sm text-gray-500 border-t pt-3">
            {tempSelected.length === 0
              ? "Nenhuma categoria selecionada (exportará todas)"
              : `${tempSelected.length} de ${categories.length} categorias selecionadas`}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleApply}>
            Aplicar Filtro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
