## 1. UI Refinement

- [x] 1.1 Verify why the product selector might be hidden in `RewardFormDialog.jsx` during edit mode.
- [x] 1.2 Modify `RewardFormDialog.jsx` to ensure the `TextField` (select) is Always visible.
- [x] 1.3 Update the onChange handler to correctly refresh `formData.id_produto` and related metadata.

## 2. Technical Validation

- [x] 2.1 Verify that `handleSave` in `Rewards.jsx` correctly captures the modified `id_produto`.
- [ ] 2.2 Test the E2E flow: Open Edit -> Change Product -> Save -> Verify update in the list.
- [ ] 2.3 Check if the backend return any error for `id_produto` change (audit log).
