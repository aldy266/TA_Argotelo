import os
import midtransclient
from dotenv import load_dotenv
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent

load_dotenv(
    BASE_DIR / ".env"
)


server_key = os.getenv("MIDTRANS_SERVER_KEY")


snap = midtransclient.Snap(
    is_production=False,
    server_key=server_key
)


def create_payment(order_id, total, customer):

    parameter = {

        "transaction_details": {
            "order_id": order_id,
            "gross_amount": int(total)
        },


        "customer_details": {
            "first_name": customer
        }

    }


    transaction = snap.create_transaction(parameter)

    return transaction["token"]
