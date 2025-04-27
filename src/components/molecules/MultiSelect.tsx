import { useState, useRef } from "react";
import { default as ReactSelect, components, InputAction } from "react-select";

type Option = {
    value: string;
    label: string;
};

const MultiSelect = (props: any) => {
    const { labelName, ...rest } = props;
    const [selectInput, setSelectInput] = useState<string>("");
    const isAllSelected = useRef<boolean>(false);
    const selectAllLabel = useRef<string>(`全ての${labelName}を選択`);
    const allOption = { value: "*", label: selectAllLabel.current };

    const filterOptions = (options: Option[], input: string) =>
        options?.filter(({ label }: Option) =>
            label.toLowerCase().includes(input.toLowerCase())
        );
    const comparator = (v1: Option, v2: Option) =>
        v1.value.localeCompare(v2.value);

    let filteredOptions = filterOptions(rest.options, selectInput);
    let filteredSelectedOptions = filterOptions(rest.value, selectInput);

    const MultiValueRemove = (props: any) => (
        <div style={{ width: "3px", borderRadius: "0 2px 2px 0", backgroundColor: "lightgray" }}></div>
    );

    const Option = (props: any) => (
        <components.Option {...props}>
            {props.value === "*" &&
                !isAllSelected.current &&
                filteredSelectedOptions?.length > 0 ? (
                <input
                    key={props.value}
                    type="checkbox"
                    ref={(input) => {
                        if (input) input.indeterminate = true;
                    }}
                />
            ) : (
                <input
                    key={props.value}
                    type="checkbox"
                    checked={props.isSelected || isAllSelected.current}
                    onChange={() => { }}
                />
            )}
            <label style={{ marginLeft: "5px" }}>{props.label}</label>
        </components.Option>
    );

    const Input = (props: any) => (
        <>
            {selectInput.length === 0 ? (
                <components.Input autoFocus={props.selectProps.menuIsOpen} {...props}>
                    {props.children}
                </components.Input>
            ) : (
                <div style={{ border: "1px dotted gray" }}>
                    <components.Input autoFocus={props.selectProps.menuIsOpen} {...props}>
                        {props.children}
                    </components.Input>
                </div>
            )}
        </>
    );

    const customFilterOption = ({ value, label }: Option, input: string) =>
        (value !== "*" && label.toLowerCase().includes(input.toLowerCase())) ||
        (value === "*" && filteredOptions?.length > 0);

    const onInputChange = (
        inputValue: string,
        event: { action: InputAction }
    ) => {
        if (event.action === "input-change") setSelectInput(inputValue);
        else if (event.action === "menu-close" && selectInput !== "")
            setSelectInput("");
    };

    const onKeyDown = (e: React.KeyboardEvent<HTMLElement>) => {
        if ((e.key === " " || e.key === "Enter") && !selectInput)
            e.preventDefault();
    };

    const handleChange = (selected: Option[]) => {
        if (
            selected.length > 0 &&
            !isAllSelected.current &&
            (selected[selected.length - 1].value === allOption.value ||
                JSON.stringify(filteredOptions) ===
                JSON.stringify(selected.sort(comparator)))
        )
            return rest.onChange(
                [
                    ...(rest.value ?? []),
                    ...rest.options.filter(
                        ({ label }: Option) =>
                            label.toLowerCase().includes(selectInput?.toLowerCase()) &&
                            (rest.value ?? []).filter((opt: Option) => opt.label === label)
                                .length === 0
                    ),
                ].sort(comparator)
            );
        else if (
            selected.length > 0 &&
            selected[selected.length - 1].value !== allOption.value &&
            JSON.stringify(selected.sort(comparator)) !==
            JSON.stringify(filteredOptions)
        )
            return rest.onChange(selected);
        else
            return rest.onChange([
                ...(rest.value ?? []).filter(
                    ({ label }: Option) =>
                        !label.toLowerCase().includes(selectInput?.toLowerCase())
                ),
            ]);
    };

    const customStyles = {
        control: (def: any) => ({
            ...def,
            cursor: "pointer",
        }),
        multiValueLabel: (def: any) => ({
            ...def,
            backgroundColor: "lightgray",
        }),
        multiValueRemove: (def: any) => ({
            ...def,
            backgroundColor: "lightgray",
        }),
        valueContainer: (base: any) => ({
            ...base,
            maxHeight: "65px",
            overflow: "auto",
        }),
        option: (styles: any, { isSelected, isFocused }: any) => {
            return {
                ...styles,
                backgroundColor:
                    isSelected && !isFocused
                        ? null
                        : isFocused && !isSelected
                            ? styles.backgroundColor
                            : isFocused && isSelected
                                ? "#DEEBFF"
                                : null,
                color: isSelected ? null : null,
                cursor: "pointer",
            };
        },
        menu: (def: any) => ({ ...def, zIndex: 9999 }),
    };

    if (rest.isSelectAll && rest.options.length !== 0) {
        isAllSelected.current =
            JSON.stringify(filteredSelectedOptions) ===
            JSON.stringify(filteredOptions);

        if (filteredSelectedOptions?.length > 0) {
            if (filteredSelectedOptions?.length === filteredOptions?.length)
                selectAllLabel.current = `全ての${labelName}(${filteredOptions.length})が選択されました`;
            else
                selectAllLabel.current = `${filteredSelectedOptions?.length} / ${filteredOptions.length} が選択されました`;
        } else selectAllLabel.current = `全ての${labelName}を選択`;

        allOption.label = selectAllLabel.current;

        return (
            <ReactSelect
                {...rest}
                placeholder={`${labelName}を選択...`}
                inputValue={selectInput}
                onInputChange={onInputChange}
                onKeyDown={onKeyDown}
                options={[allOption, ...rest.options]}
                onChange={handleChange}
                components={{
                    Option: Option,
                    Input: Input,
                    MultiValueRemove: MultiValueRemove,
                    ...rest.components,
                }}
                filterOption={customFilterOption}
                menuPlacement={rest.menuPlacement ?? "auto"}
                styles={customStyles}
                isMulti
                closeMenuOnSelect={false}
                tabSelectsValue={false}
                backspaceRemovesValue={true}
                hideSelectedOptions={false}
                blurInputOnSelect={false}
            />
        );
    }

    return (
        <ReactSelect
            {...rest}
            placeholder={`${labelName}を選択...`}
            inputValue={selectInput}
            onInputChange={onInputChange}
            filterOption={customFilterOption}
            components={{
                Input: Input,
                ...rest.components,
            }}
            menuPlacement={rest.menuPlacement ?? "auto"}
            onKeyDown={onKeyDown}
            tabSelectsValue={false}
            hideSelectedOptions={true}
            backspaceRemovesValue={false}
            blurInputOnSelect={true}
        />
    );
};

export { MultiSelect };
export type { Option };
