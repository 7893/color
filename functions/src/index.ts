// functions/src/index.ts
import {
  onRequest,
  Request as FirebaseRequest,
} from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import {config} from "firebase-functions";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const ibmdb = require("ibm_db");

const functionOptions = {
  region: "asia-northeast1",
};

export const logPaletteToDb2 = onRequest(
  functionOptions,
  async (request: FirebaseRequest, response) => {
    response.set("Access-Control-Allow-Origin", "*"); // TODO: Restrict
    response.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    response.set("Access-Control-Allow-Headers", "Content-Type");

    if (request.method === "OPTIONS") {
      response.status(204).send("");
      return;
    }

    if (request.method !== "POST") {
      logger.warn("Method Not Allowed:", {method: request.method});
      response.status(405).json({error: "Method Not Allowed"});
      return;
    }

    const paletteColors = request.body.colors;

    if (
      !paletteColors ||
      !Array.isArray(paletteColors) ||
      paletteColors.length === 0
    ) {
      logger.warn("Bad Request: 'colors' array is missing or empty.", {
        body: request.body,
      });
      response
        .status(400)
        .json({error: "Bad Request: 'colors' array is missing or empty."});
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let dbConnection: any | null = null;
    try {
      const dsn = config().ibmdb?.dsn;
      if (!dsn) {
        logger.error(
          "Db2 DSN (ibmdb.dsn) not found in Firebase config. " +
          "Ensure 'firebase functions:config:set ibmdb.dsn=\"<DSN>\"' was run."
        );
        response
          .status(500)
          .json({error: "Database configuration error on server."});
        return;
      }

      logger.info("Attempting to connect to Db2...");

      dbConnection = await new Promise<unknown>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ibmdb.open(dsn, (err: any, conn: any) => {
          if (err || !conn) {
            logger.error("Db2 connection failed.", {error: err?.message});
            reject(new Error("Database connection failed."));
            return;
          }
          logger.info("Db2 connection established.");
          resolve(conn);
        });
      });

      const colorsJson = JSON.stringify(paletteColors);
      const insertSql = "INSERT INTO LOGGED_PALETTES (COLORS_DATA) VALUES (?)";

      const logPreview = colorsJson.length > 60 ?
        `${colorsJson.substring(0, 60)}...` :
        colorsJson;
      logger.info("Inserting palette (preview):", logPreview);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const stmt: any = await new Promise<any>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (dbConnection as any).prepare(
          insertSql,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (err: Error | null, preparedStmt: any) => {
            if (err || !preparedStmt) {
              logger.error("Db2 SQL Prepare Error.", {
                message: err?.message,
                sql: insertSql,
              });
              return reject(new Error("Failed to prepare SQL statement."));
            }
            resolve(preparedStmt);
          }
        );
      });

      await new Promise<void>((resolve, reject) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        stmt.execute([colorsJson], (err: Error | null, result: any) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          stmt.close((closeErr: Error | null) => {
            if (closeErr) {
              logger.warn("Error closing statement after execution:", {
                message: closeErr.message,
              });
            }
          });
          if (err) {
            logger.error("Db2 SQL Execution Error:", {
              message: err.message,
              sql: insertSql,
            });
            return reject(
              new Error("Failed to save palette data to the database.")
            );
          }
          logger.info("Palette data logged successfully.", {result});
          resolve();
        });
      });

      response.status(200).json({message: "Palette logged successfully!"});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      logger.error("Operation failed.", {
        error: error.message,
        stack: error.stack,
      });
      response.status(500).json({
        error: "Internal server error.",
        details: error.message,
      });
    } finally {
      if (dbConnection) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          if (dbConnection!.closeSync()) {
            logger.info("Db2 connection closed.");
          } else {
            logger.warn("Db2 connection closure issue (closeSync).");
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (closeError: any) {
          logger.error("Failed to close Db2 connection.", {
            error: closeError.message,
          });
        }
      }
    }
  }
);

