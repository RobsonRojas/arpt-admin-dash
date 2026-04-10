## Context

The current `RewardFormDialog` component is intended to handle both creation and editing of rewards. While the code includes a product selector, visual evidence (user feedback/screenshot) suggests that either the selector is not rendering correctly during edit mode, or the user experience is confusing due to the absence of the dropdown when a product is already selected.

## Goals / Non-Goals

**Goals:**
- Ensure the product selection dropdown is available and correctly populated when editing an existing reward.
- Maintain data integrity by ensuring the payload to the backend includes the updated `id_produto`.
- Provide immediate visual feedback (grey box update) when a different product is selected.

**Non-Goals:**
- Modifying the underlying data schema of rewards or products.
- Adding new fields to the reward model.
- Changing the backend API logic (unless a bug is found).

## Decisions

- **UI Persistence**: We will ensure the `TextField` with `select` remains visible even when `isEditing` is true.
- **Data Flow**: The `handleSave` function in `Rewards.jsx` already includes `id_produto` in the payload; we will verify its value is derived correctly from the form state.
- **Validation**: Add a check to ensure `id_produto` is not empty before submission (already present but will be reinforced).

## Risks / Trade-offs

- **Form Reset**: If the user accidentally changes the product and doesn't notice, they might update the reward with wrong associations. Mitigation: The "Dados do Produto Selecionado" box provides clear confirmation of the current selection.
