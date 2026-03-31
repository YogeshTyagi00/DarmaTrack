from hypothesis import settings, HealthCheck

# Register and load the CI profile with max_examples=100
settings.register_profile(
    "ci",
    max_examples=100,
    suppress_health_check=[HealthCheck.too_slow],
)
settings.load_profile("ci")
