# db_manager.py
import os
import time
import mysql.connector
from mysql.connector import Error
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        logger.info("Initializing DatabaseManager")
        self.config = {
            'host': '127.0.0.1',
            'user': 'app_user',
            'password': '9pQK?fJF.9Lm]nv;',
            'database': 'modernity_survey',
            'port': 3307,
            'connect_timeout': 5
        }

    def get_connection(self):
        """Get a fresh database connection."""
        try:
            connection = mysql.connector.connect(**self.config)
            logger.info("New database connection established")
            return connection
        except Error as e:
            logger.error(f"Error creating connection: {e}")
            raise

    def save_response(self, survey_data: dict) -> int:
        """Save raw survey response."""
        logger.info("Attempting to save survey response")
        attempt = 0
        max_attempts = 3

        while attempt < max_attempts:
            connection = None
            cursor = None
            try:
                # Get fresh connection
                connection = self.get_connection()
                cursor = connection.cursor()
                
                query = """
                INSERT INTO survey_results 
                (session_id, q1_response, q2_response, q3_response, q4_response, 
                 q5_response, q6_response, browser, region, source, hash_email_session)
                VALUES (%(session_id)s, %(q1_response)s, %(q2_response)s, 
                        %(q3_response)s, %(q4_response)s, %(q5_response)s, 
                        %(q6_response)s, %(browser)s, %(region)s, %(source)s, 
                        %(hash_email_session)s)
                """
                cursor.execute(query, survey_data)
                connection.commit()
                last_id = cursor.lastrowid
                logger.info(f"Survey response saved successfully, ID: {last_id}")
                return last_id

            except Error as e:
                attempt += 1
                logger.error(f"Database error (attempt {attempt}/{max_attempts}): {e}")
                if attempt >= max_attempts:
                    raise
                time.sleep(1)

            finally:
                if cursor:
                    cursor.close()
                if connection:
                    connection.close()

        raise RuntimeError("Failed to save survey response after multiple attempts")