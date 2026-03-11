# ADP Demo Flow

The `adp-v2-demo.sh` script demonstrates the full ADP v2 MVP flow with `curl` commands against a local ADP server.

## Running the demo

Start the application locally first, for example with:

```bash
npm run dev
```

Then run the demo script:

```bash
bash examples/adp-v2-demo.sh
```

You can also use:

```bash
make demo
```

The script uses placeholder variables such as `SESSION_ID`, `TRANSACTION_ID`, and `PROVIDER_DID`. Replace them with values returned by earlier API responses as you step through the flow.

## Expected protocol sequence

The demo walks through these steps:

1. Register an agent
2. Create a handshake session
3. Discover matching providers
4. Negotiate service intent with a provider
5. Create a transaction
6. Update transaction status
7. Record a reputation signal

Each step demonstrates one part of the ADP v2 interaction model:

- registration establishes agent identity
- handshake creates session context
- discovery finds providers
- negotiation validates the selected provider
- transaction creation records the service interaction
- status updates move the transaction through its lifecycle
- reputation records post-transaction trust feedback
