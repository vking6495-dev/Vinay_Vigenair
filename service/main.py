# Copyright 2024 Google LLC.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     https://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

"""Vigenair module.

This module is the main module for Vigenair's server-side components.

This file is the target of a "Cloud Storage" Trigger (Finalize/Create) Cloud
Function, with `gcs_file_uploaded` as the main entry point.
"""

import logging
from typing import Any, Dict

# Import FastAPI and uvicorn
from fastapi import FastAPI
import uvicorn

import combiner as CombinerService
import config as ConfigService
import extractor as ExtractorService
# functions_framework is no longer needed for Uvicorn-based local testing
# import functions_framework
from google.api_core.client_info import ClientInfo
from google.cloud import logging as cloudlogging
import utils as Utils

# Initialize FastAPI app
app = FastAPI()

# Configure Google Cloud Logging client
lg_client = cloudlogging.Client(
    client_info=ClientInfo(user_agent=ConfigService.USER_AGENT_ID)
)
lg_client.setup_logging()

# Define the core logic of your Cloud Function as a regular Python function
# The @functions_framework.cloud_event decorator is removed as FastAPI handles routing
def process_gcs_file_event(cloud_event_data: Dict[str, Any]):
  """Processes a simulated Cloud Storage event.

  Args:
    cloud_event_data: A dictionary representing the Cloud Storage event payload.
  """
  # Access 'data' key from the cloud_event_data dictionary
  data = cloud_event_data.get('data', {})
  bucket = data.get('bucket')
  filepath = data.get('name')

  if not bucket or not filepath:
      logging.error("Invalid event data: 'bucket' or 'name' missing.")
      return {"status": "error", "message": "Invalid event data."}

  logging.info('BEGIN - Processing uploaded file: %s from bucket %s...', filepath, bucket)

  trigger_file = Utils.TriggerFile(filepath)

  if trigger_file.is_extractor_initial_trigger():
    logging.info('TRIGGER - Extractor initial trigger')
    extractor_instance = ExtractorService.Extractor(
        gcs_bucket_name=bucket, media_file=trigger_file
    )
    extractor_instance.initial_extract()
  elif trigger_file.is_extractor_audio_trigger():
    logging.info('TRIGGER - Extractor audio trigger')
    extractor_instance = ExtractorService.Extractor(
        gcs_bucket_name=bucket, media_file=trigger_file
    )
    extractor_instance.extract_audio()
  elif trigger_file.is_extractor_video_trigger():
    logging.info('TRIGGER - Extractor video trigger')
    extractor_instance = ExtractorService.Extractor(
        gcs_bucket_name=bucket, media_file=trigger_file
    )
    extractor_instance.extract_video()
  elif (
      trigger_file.is_extractor_finalise_audio_trigger()
      or trigger_file.is_extractor_finalise_video_trigger()
  ):
    logging.info('TRIGGER - Extractor finalise audio/video trigger')
    extractor_instance = ExtractorService.Extractor(
        gcs_bucket_name=bucket, media_file=trigger_file
    )
    extractor_instance.check_finalise_extraction()
  elif trigger_file.is_extractor_finalise_trigger():
    logging.info('TRIGGER - Extractor finalise trigger')
    extractor_instance = ExtractorService.Extractor(
        gcs_bucket_name=bucket, media_file=trigger_file
    )
    extractor_instance.finalise_extraction()
  elif trigger_file.is_extractor_split_segment_trigger():
    logging.info('TRIGGER - Extractor split segment trigger')
    extractor_instance = ExtractorService.Extractor(
        gcs_bucket_name=bucket, media_file=trigger_file
    )
    extractor_instance.split_av_segment()
  elif trigger_file.is_combiner_initial_trigger():
    logging.info('TRIGGER - Combiner initial trigger')
    combiner_instance = CombinerService.Combiner(
        gcs_bucket_name=bucket, render_file=trigger_file
    )
    combiner_instance.initial_render()
  elif trigger_file.is_combiner_render_trigger():
    logging.info('TRIGGER - Combiner render trigger')
    combiner_instance = CombinerService.Combiner(
        gcs_bucket_name=bucket, render_file=trigger_file
    )
    combiner_instance.render()
  elif trigger_file.is_combiner_finalise_trigger():
    logging.info('TRIGGER - Combiner finalise trigger')
    combiner_instance = CombinerService.Combiner(
        gcs_bucket_name=bucket, render_file=trigger_file
    )
    combiner_instance.finalise_render()
  else:
      logging.info('No specific trigger matched for file: %s', filepath)


  logging.info('END - Finished processing uploaded file: %s.', filepath)
  return {"status": "processed", "filepath": filepath}

# Define a FastAPI endpoint to receive the event data
@app.post("/trigger-event")
async def trigger_event(cloud_event_payload: Dict[str, Any]):
    """
    Endpoint to simulate a Cloud Storage event.
    Send a POST request with the Cloud Event JSON payload.
    """
    logging.info("Received request to /trigger-event with payload: %s", cloud_event_payload)
    result = process_gcs_file_event(cloud_event_payload)
    return result

# Optional: Add a simple root endpoint to check if the server is running
@app.get("/")
async def read_root():
    return {"message": "Vigenair backend is running. Use /trigger-event to send Cloud Storage events."}

# This block allows you to run the application directly using `python main.py`
if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)