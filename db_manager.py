# db_manager.py
import os
import mysql.connector
from mysql.connector import Error
import logging
from typing import Dict, Tuple  # Added Tuple here
from decimal import Decimal

# Set up detailed logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class DatabaseManager:
    def __init__(self):
        logger.info("Initializing DatabaseManager")
        self.connection = None
        self.connect()

    def connect(self):
        logger.info("Attempting database connection")
        try:
            config = {
                'host': '127.0.0.1',
                'user': 'app_user',
                'password': '9pQK?fJF.9Lm]nv;',
                'database': 'modernity_survey',
                'port': 3307
            }
            
            self.connection = mysql.connector.connect(**config)
            logger.info("Database connection successful")
            
        except Error as e:
            logger.error(f"Error connecting to database: {e}")
            raise

    def calculate_coordinates(self, scores: list) -> Tuple[Decimal, Decimal]:
        """Convert ternary coordinates to Cartesian x,y coordinates."""
        pre, mod, post = scores
        total = sum(scores)
        
        if total == 0:
            return Decimal('0.00'), Decimal('0.00')
            
        x = Decimal(str((2 * pre + mod) / (2 * total) * 100))
        y = Decimal(str((mod * 0.866) / total * 100))
        
        return round(x, 2), round(y, 2)

    def calculate_triplet_values(self, responses: Dict) -> Tuple[int, int, int]:
        """Calculate raw n1 (PreModern), n2 (Modern), n3 (PostModern) values."""
        n1, n2, n3 = 0, 0, 0
        
        for q_key, response_num in responses.items():
            if response_num is not None:
                if response_num == 1:  # Pure PreModern
                    n1 += 100
                elif response_num == 2:  # Pure Modern
                    n2 += 100
                elif response_num == 3:  # Pure PostModern
                    n3 += 100
                elif response_num == 4:  # PreModern-Modern
                    n1 += 50
                    n2 += 50
                elif response_num == 5:  # Modern-Balanced
                    n1 += 25
                    n2 += 50
                    n3 += 25
        
        return n1, n2, n3
    
    def save_response(self, survey_data: dict) -> int:
        """Save survey response with calculated values."""
        logger.info("Attempting to save survey response")
        cursor = None
        try:
            cursor = self.connection.cursor()
            query = """
            INSERT INTO survey_results 
            (session_id, q1_response, q2_response, q3_response, q4_response, 
            q5_response, q6_response, n1, n2, n3, plot_x, plot_y,
            browser, region, source, hash_email_session)
            VALUES (%(session_id)s, %(q1_response)s, %(q2_response)s, 
                    %(q3_response)s, %(q4_response)s, %(q5_response)s, 
                    %(q6_response)s, %(n1)s, %(n2)s, %(n3)s, %(plot_x)s, 
                    %(plot_y)s, %(browser)s, %(region)s, %(source)s, 
                    %(hash_email_session)s)
            """
            
            # Calculate n1, n2, n3 values
            responses = {
                'Q1': survey_data.get('q1_response'),
                'Q2': survey_data.get('q2_response'),
                'Q3': survey_data.get('q3_response'),
                'Q4': survey_data.get('q4_response'),
                'Q5': survey_data.get('q5_response'),
                'Q6': survey_data.get('q6_response')
            }
            
            n1, n2, n3 = self.calculate_triplet_values(responses)
            
            # Calculate percentage scores for plot coordinates
            total = n1 + n2 + n3
            if total > 0:
                scores = [
                    (n1 / total) * 100,
                    (n2 / total) * 100,
                    (n3 / total) * 100
                ]
            else:
                scores = [0, 0, 0]
                
            # Calculate plot coordinates
            plot_x, plot_y = self.calculate_coordinates(scores)
            
            # Add calculated values to survey data
            survey_data.update({
                'n1': n1,
                'n2': n2,
                'n3': n3,
                'plot_x': plot_x,
                'plot_y': plot_y
            })
            
            cursor.execute(query, survey_data)
            self.connection.commit()
            last_id = cursor.lastrowid
            logger.info(f"Survey response saved successfully, ID: {last_id}")
            return last_id
                
        except Error as e:
            logger.error(f"Survey save error: {e}")
            if self.connection:
                self.connection.rollback()
            raise
        finally:
            if cursor:
                cursor.close()

    def test_connection(self):
        """Test insert a dummy record."""
        logger.info("Attempting test insert")
        cursor = None
        try:
            cursor = self.connection.cursor()
            test_data = {
                'session_id': 'test-session',
                'q1_response': 1,
                'q2_response': 1,
                'q3_response': 1,
                'q4_response': 1,
                'q5_response': 1,
                'q6_response': 1,
                'browser': 'test',
                'source': 'test',
                'region': None,
                'hash_email_session': None,
            }
            
            query = """
            INSERT INTO survey_results 
            (session_id, q1_response, q2_response, q3_response, q4_response, 
             q5_response, q6_response, browser, region, source, hash_email_session)
            VALUES (%(session_id)s, %(q1_response)s, %(q2_response)s, 
                    %(q3_response)s, %(q4_response)s, %(q5_response)s, 
                    %(q6_response)s, %(browser)s, %(region)s, %(source)s, 
                    %(hash_email_session)s)
            """
            cursor.execute(query, test_data)
            self.connection.commit()
            last_id = cursor.lastrowid
            logger.info(f"Test insert successful, ID: {last_id}")
            return last_id
            
        except Error as e:
            logger.error(f"Test insert error: {e}")
            if self.connection:
                self.connection.rollback()
            raise
        finally:
            if cursor:
                cursor.close()