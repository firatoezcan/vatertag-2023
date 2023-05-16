import { FormControl, FormHelperText, InputLabel, MenuItem, Select, SelectProps } from "@mui/material";
import React, { FC } from "react";
import { get, useFormContext, useFormState } from "react-hook-form";

type HookFormSelectProps = Omit<SelectProps, "error" | "helperText" | "variant" | "required"> & {
  name: string;
  options: Array<{ label: string; value: any }>;
  optional?: true;
};

export const HookFormSelect: FC<React.PropsWithChildren<HookFormSelectProps>> = (props) => {
  const { options, optional, ...selectProps } = props;
  const { name, label } = selectProps;
  const { register } = useFormContext();
  const { dirtyFields, errors, isSubmitted, defaultValues } = useFormState({ name: name });

  const defaultValue = get(defaultValues, name);
  const isDirtyField = get(dirtyFields, name);
  const error = get(errors, name);
  const hasError = (isSubmitted || isDirtyField) && Boolean(error);

  return (
    <FormControl fullWidth error={hasError}>
      <InputLabel>{`${label}${optional ? ` (optional)` : ""}`}</InputLabel>
      <Select {...selectProps} {...register(name)} defaultValue={defaultValue ?? ""}>
        {options.map((option, index) => (
          <MenuItem key={index} value={option.value}>
            {option.label}
          </MenuItem>
        ))}
      </Select>
      {hasError && (
        <FormHelperText>
          <>{error?.message}</>
        </FormHelperText>
      )}
    </FormControl>
  );
};
