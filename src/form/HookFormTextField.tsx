import { TextField, TextFieldProps } from "@mui/material";
import React, { FC, useRef } from "react";
import { get, useFormContext, useFormState } from "react-hook-form";

export type HookFormTextFieldProps = Omit<TextFieldProps, "error" | "variant" | "required"> & { name: string; optional?: true; validateOnBlur?: true };

export const HookFormTextField: FC<React.PropsWithChildren<HookFormTextFieldProps>> = (props) => {
  const { name, optional, validateOnBlur, helperText, ...restProps } = props;
  const { register, trigger } = useFormContext();
  const { dirtyFields, errors, isSubmitted, defaultValues } = useFormState({ name: name });
  const hadErrorRef = useRef(false);

  const defaultValue = get(defaultValues, name);
  const isDirtyField = get(dirtyFields, name);
  const error = get(errors, name);
  const hasError = (isSubmitted || isDirtyField) && Boolean(error);

  if (error) {
    hadErrorRef.current = true;
  }

  const { onChange, onBlur, ...fields } = register(name);

  return (
    <TextField
      fullWidth
      {...restProps}
      {...fields}
      label={`${props.label}${optional ? ` (optional)` : ""}`}
      defaultValue={defaultValue ?? ""}
      error={hasError}
      helperText={<>{hasError ? error?.message : helperText}</>}
      variant="outlined"
      onChange={
        validateOnBlur && !isSubmitted
          ? (...args) => {
              onChange(...args);
              if (hadErrorRef.current) {
                trigger(name);
              }
            }
          : onChange
      }
      onBlur={
        validateOnBlur && !isSubmitted
          ? (...args) => {
              hadErrorRef.current = false;
              trigger(name);
              onBlur(...args);
            }
          : onBlur
      }
    />
  );
};
