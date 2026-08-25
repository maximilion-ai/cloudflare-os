import type { WorkerEntrypoint } from "cloudflare:workers";

/** A completed Gadget response that should be delivered back to the chat gateway. */
export type GadgetResponse = {
  text: string;
};

/** Methods exposed by the persistent chat gateway callback entrypoint. */
export interface ChatGatewayRpcTargetMethods {
  /**
   * Deliver the completed Gadget response. Implementations must be idempotent because delivery is
   * at-least-once when response target acknowledgements fail.
   */
  onGadgetResponse(response: GadgetResponse): Promise<void>;
}

/** Persistent service callback invoked after the originating Worker request has ended. */
export type ChatGatewayRpcTarget = Service<WorkerEntrypoint & ChatGatewayRpcTargetMethods>;

/** External message submission accepted by the backend gateway. */
export type SubmitExternalMessageInput = {
  /**
   * Selects the Gadgets account used to submit the message.
   * The backend trusts the gateway: supplying this email grants access as that account.
   */
  callerEmail: string;
  /** Selects the workspace to create or reuse. */
  gadgetKey: string;
  /** Selects the chat to create or reuse. */
  chatKey: string;
  /** Deduplicates the originating message and correlates the response target. */
  messageKey: string;
  /** Names the workspace if it must be created. */
  gadgetTitle: string;
  /** User text sent to Gadgets. */
  prompt: string;
  /** Persistent target invoked when the Gadget response is ready. */
  chatGatewayRpcTarget: ChatGatewayRpcTarget;
};

/** Existing workspace message submitted by a trusted external gateway. */
export type SubmitExistingWorkspaceMessageInput = {
  /**
   * Selects the Gadgets account used to submit the message.
   * The backend trusts the gateway: supplying this email grants access as that account.
   */
  callerEmail: string;
  /** Durable Object ID of an existing workspace the caller owns or can build in. */
  workspaceId: string;
  /** Selects the external chat to create or reuse within the workspace. */
  chatKey: string;
  /** Deduplicates the originating message and correlates the response target. */
  messageKey: string;
  /** User text sent to the existing workspace. */
  prompt: string;
  /** Persistent target invoked when the workspace response is ready. */
  chatGatewayRpcTarget: ChatGatewayRpcTarget;
};

/** Submission result returned by the backend gateway. */
export type SubmitExternalMessageResult =
  | {
      accepted: true;
      chatPath: string;
    }
  | {
      accepted: false;
      /** User-facing explanation of an actionable submission rejection. */
      message: string;
    };

/** Service binding RPC interface used by chat gateway workers. */
export interface ExternalMessageGateway {
  /** Submit an external chat message for Gadget routing and execution. */
  submitExternalMessage(input: SubmitExternalMessageInput): Promise<SubmitExternalMessageResult>;

  /** Submit a message to an existing workspace without creating or claiming one. */
  submitExistingWorkspaceMessage(
    input: SubmitExistingWorkspaceMessageInput,
  ): Promise<SubmitExternalMessageResult>;
}
