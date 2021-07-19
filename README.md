# nrb-dt-pull-request-checker-action
Github action to check PR existence before merging another PR

## Inputs

| Name              | Required | Description                                                                            |
| ----------------- | -------- | -------------------------------------------------------------------------------------- |
| `github_token`    |          | A github token to give more permission than default github action permissions |
| `head_ref`        | x        | The branch that must be merged in the default_ref branch before be merged in the base_ref branch  |
| `base_ref`        | x        | The branch where merge is only possible if the head_ref branch is merged in the default branch |
| `default_ref`  | x        | The branch where head_ref branch must be merged before other merges|

## Outputs

* If a merged pull request from `head_ref` to `default_ref` is found, add a review to approve the pull request from `head_ref` to `base_ref`
* If a closed pull request or no pull request from `head_ref` to `default_ref` is found, create automatically a pull request from `head_ref` to `default_ref` and add a review to request change which ask to merge the pull request `head_ref` to `default_ref`
* If a opened pull request from `head_ref` to `default_ref` is found, add a review to request change which ask to merge the pull request `head_ref` to `default_ref`

## Example usage

```yaml
uses: nrbdigital/nrb-dt-pull-request-checker-action@master
with:
  github_token: ${{ secret.GITHUB_TOKEN }}
  head_ref: ${{ env.GITHUB_HEAD_REF }}
  base_ref: ${{ env.GITHUB_BASE_REF }}
  default_ref: develop
```
