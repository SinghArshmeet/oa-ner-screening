from pathlib import Path
import tempfile

import streamlit as st

from oa_screening.fusion import fuse_screening
from oa_screening.movement_prediction import predict_video
from oa_screening.questionnaire import QuestionnaireResponse, score_questionnaire


st.set_page_config(page_title="OA Risk Screening Prototype", page_icon="🦵")
st.title("OA Risk Screening Prototype")
st.caption("Research-only screening support. This tool does not diagnose osteoarthritis or replace a clinician.")

movement_tab, questionnaire_tab, results_tab, xray_tab = st.tabs(["Movement", "Questionnaire", "Results", "X-ray"])

with movement_tab:
    st.subheader("Movement analysis")
    st.caption("Upload a short, well-lit, side-view walking video with the full body visible. The video is processed locally for this session.")
    st.metric("Validated research baseline", "74.4%", "subject-level held-out accuracy")
    video = st.file_uploader("Walking video", type=["mov", "mp4", "avi", "mkv"], key="movement_video")
    if video and st.button("Analyse movement video", type="primary"):
        suffix = Path(video.name).suffix or ".mp4"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as temp:
            temp.write(video.getbuffer())
            temporary_path = temp.name
        try:
            with st.spinner("Extracting body landmarks and analysing movement..."):
                outcome = predict_video(temporary_path, Path("artifacts/movement_baseline.joblib"))
            st.session_state["movement_result"] = outcome
            st.success("Movement indication calculated. Open Results for the full screening summary.")
        except FileNotFoundError:
            st.error("The movement model file is missing. Train the baseline before using video analysis.")
        except ValueError as error:
            st.warning(str(error))
        finally:
            Path(temporary_path).unlink(missing_ok=True)

with questionnaire_tab:
    st.subheader("Patient-reported inputs")
    st.caption("Enter responses with consent. Nothing is stored by this prototype.")
    with st.form("questionnaire"):
        age = st.number_input("Age", min_value=18, max_value=120, value=50)
        pain = st.slider("Knee pain in the past week (0 = none, 10 = worst)", 0, 10, 0)
        stiffness = st.slider("Knee stiffness (0 = none, 10 = worst)", 0, 10, 0)
        difficulty_labels = ["None", "Mild", "Moderate", "Severe"]
        walking = st.select_slider("Difficulty walking", options=difficulty_labels, value="None")
        stairs = st.select_slider("Difficulty climbing stairs", options=difficulty_labels, value="None")
        injury = st.checkbox("Previous knee injury")
        duration = st.number_input("How many weeks have symptoms been present?", min_value=0, max_value=520, value=0)
        workload = st.selectbox("Usual physical workload", ["low", "moderate", "high"], format_func=str.title)
        submitted = st.form_submit_button("Calculate questionnaire indication")

    if submitted:
        response = QuestionnaireResponse(
            age=int(age), pain_0_to_10=pain, stiffness_0_to_10=stiffness,
            walking_difficulty=difficulty_labels.index(walking), stairs_difficulty=difficulty_labels.index(stairs),
            previous_knee_injury=injury, symptoms_weeks=int(duration), physical_workload=workload,
        )
        result = score_questionnaire(response)
        st.session_state["questionnaire_result"] = result
        st.success("Questionnaire indication calculated. View Results for the explanation.")

with results_tab:
    st.subheader("Separate module results")
    questionnaire_result = st.session_state.get("questionnaire_result")
    movement_result = st.session_state.get("movement_result")
    left, right = st.columns(2)
    with left:
        if movement_result:
            st.metric("Movement indication", movement_result["category"].title(), f"model confidence: {movement_result['confidence']:.0%}")
            st.caption(f"Dataset severity label predicted: {movement_result['dataset_label'].title()}")
            st.write(f"Pose detection rate: {movement_result['features']['pose_detection_rate']:.0%}")
        else:
            st.info("Upload a walking video to calculate movement indication.")
    with right:
        if questionnaire_result:
            st.metric("Questionnaire indication", questionnaire_result.category.title(), f"prototype score: {questionnaire_result.score}")
            if questionnaire_result.contributing_factors:
                st.caption("Contributing inputs: " + "; ".join(questionnaire_result.contributing_factors) + ".")
        else:
            st.info("Complete the questionnaire to calculate its indication.")
    if movement_result and questionnaire_result:
        category, recommendation = fuse_screening(movement_result["category"], questionnaire_result.category)
        st.divider()
        st.metric("Combined screening indication", category.title())
        st.write(recommendation)
    st.warning("Research-only screening support. This tool does not diagnose osteoarthritis or replace a clinician.")

with xray_tab:
    st.subheader("X-ray analysis")
    st.info("The KL-grade X-ray dataset is organized and ready for training, but no X-ray model weights have been trained for this project yet. X-ray upload and Grad-CAM will be enabled after validation on the fixed train/validation/test splits.")
