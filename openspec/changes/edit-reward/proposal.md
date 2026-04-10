## Why

Currently, the Reward editing interface in the ARPT Admin Dashboard does not allow users to change the Product associated with an existing Reward. This limitation forces users to delete and recreate rewards if they need to change the underlying product (e.g., swapping for a newer batch or a related product), which is inefficient and disrupts the management workflow.

## What Changes

- **Frontend (Dialog)**: Modify the `RewardFormDialog` to ensure the product selector (dropdown) is visible and interactive during the editing phase.
- **Frontend (Page)**: Ensure the `Rewards` page correctly handles product selection updates and passes the updated `id_produto` to the technical update service.
- **State Management**: Confirm that the `AdminContext` correctly propagates the product ID change to the backend API.

## Capabilities

### New Capabilities
- `edit-reward-product`: Enable dynamic product reassignment for existing rewards.

### Modified Capabilities
- `products-rewards`: Extend the existing reward management capability to include product update functionality during editing.

## Impact

- **UI**: `RewardFormDialog.jsx` will be updated to show the product selector in edit mode.
- **Context**: `AdminContext.jsx`'s `updateReward` method will be used to persist the change.
- **Audit**: Log the product change in the audit trail.
